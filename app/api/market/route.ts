import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/* eslint-disable @typescript-eslint/no-explicit-any */

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/** "EU 42.5" | "42,5" | "EU 40 2/3" → 42.5 | 40.67 */
function num(s: unknown): number | null {
  if (s == null) return null
  const str = String(s).replace(',', '.')
  const frac = str.match(/(\d+)\s+(\d)\/(\d)/)
  if (frac) return +frac[1] + +frac[2] / +frac[3]
  const m = str.match(/\d+(\.\d+)?/)
  return m ? parseFloat(m[0]) : null
}
const same = (a: number | null, b: number | null) => a != null && b != null && Math.abs(a - b) < 0.05

type Quote = { price: number } | 'subscription' | null
type Provider = (sku: string, sizeEu: number) => Promise<Quote>

/* ───────── KicksDB (payant) ───────── */
const KICKS = 'https://api.kicks.dev/v3'
const kicksCache = new Map<string, any[] | 'subscription' | null>()

async function kicksVariants(sku: string): Promise<any[] | 'subscription' | null> {
  if (kicksCache.has(sku)) return kicksCache.get(sku)!
  const key = process.env.KICKSDB_API_KEY
  if (!key) return null
  const h = { Authorization: `Bearer ${key}` }
  let out: any[] | 'subscription' | null = null
  try {
    const r1 = await fetch(`${KICKS}/stockx/products?query=${encodeURIComponent(sku)}&currency=EUR&market=FR`, { headers: h, cache: 'no-store' })
    if (r1.status === 403) out = 'subscription'
    else if (r1.ok) {
      const d1 = await r1.json()
      const list: any[] = Array.isArray(d1?.data) ? d1.data : []
      const p = list.find(x => String(x.sku ?? '').toUpperCase() === sku) ?? list[0]
      if (p?.id) {
        await sleep(300)
        const r2 = await fetch(`${KICKS}/stockx/products/${p.id}/variants?currency=EUR&market=FR`, { headers: h, cache: 'no-store' })
        if (r2.status === 403) out = 'subscription'
        else if (r2.ok) { const d2 = await r2.json(); out = Array.isArray(d2?.data) ? d2.data : Array.isArray(d2) ? d2 : null }
      }
    }
  } catch { out = null }
  kicksCache.set(sku, out)
  return out
}

const kicksdb: Provider = async (sku, sizeEu) => {
  const vs = await kicksVariants(sku)
  if (vs === 'subscription') return 'subscription'
  if (!vs) return null
  const v = vs.find(x => same(num(x.size_eu ?? x.eu ?? x.sizes?.find((s: any) => /eu/i.test(s.type))?.size ?? (/^EU/i.test(String(x.size ?? '')) ? x.size : null)), sizeEu))
  const price = num(v?.lowest_ask ?? v?.market?.lowest_ask ?? v?.market?.bids?.lowest_ask ?? v?.lowest_price?.amount ?? v?.lowest_price ?? v?.price)
  return price ? { price } : null
}

/* ───────── veilleio via RapidAPI (gratuit, 1 req/s) ───────── */
const RAPID = 'https://stockx1.p.rapidapi.com/v2/stockx'
const rapidCache = new Map<string, any[] | null>()

async function rapidVariants(sku: string): Promise<any[] | null> {
  if (rapidCache.has(sku)) return rapidCache.get(sku)!
  const key = process.env.RAPIDAPI_KEY
  if (!key) return null
  const h = { 'x-rapidapi-key': key, 'x-rapidapi-host': 'stockx1.p.rapidapi.com' }
  let out: any[] | null = null
  try {
    await sleep(1100)
    const r1 = await fetch(`${RAPID}/search?query=${encodeURIComponent(sku)}&limit=5`, { headers: h, cache: 'no-store' })
    if (r1.ok) {
      const list: any[] = await r1.json()
      const hit = (Array.isArray(list) ? list : []).find(x => String(x.sku ?? '').toUpperCase() === sku) ?? list?.[0]
      if (hit?.slug) {
        await sleep(1100)
        const r2 = await fetch(`${RAPID}/product?query=${encodeURIComponent(hit.slug)}&currency=EUR&country=FR`, { headers: h, cache: 'no-store' })
        if (r2.ok) {
          const p = await r2.json()
          // sécurité : on ne garde que si le SKU correspond
          if (!p?.sku || String(p.sku).toUpperCase() === sku) out = Array.isArray(p?.variants) ? p.variants : null
        }
      }
    }
  } catch { out = null }
  rapidCache.set(sku, out)
  return out
}

const veilleio: Provider = async (sku, sizeEu) => {
  const vs = await rapidVariants(sku)
  if (!vs) return null
  const v = vs.find(x => same(num(x.sizes?.find((s: any) => s.type === 'eu')?.size), sizeEu))
  const price = num(v?.market?.bids?.lowest_ask) ?? num(v?.market?.sales?.last_sale)
  return price ? { price } : null
}

/* ───────── Refresh ───────── */
async function refresh(where: { userId?: number }) {
  const pairs = await prisma.purchase.findMany({
    where: { ...where, status: 'IN_STOCK', sku: { not: '' } },
    select: { id: true, sku: true, size: true },
  })
  const now = new Date()
  let updated = 0
  let subscription = false
  let used: 'kicksdb' | 'veilleio' | null = null

  for (const p of pairs) {
    const sku = (p.sku ?? "").trim().toUpperCase()
    const sizeEu = num(p.size)
    if (!sku || sizeEu == null) continue

    let q: Quote = await kicksdb(sku, sizeEu)
    if (q === 'subscription') { subscription = true; q = null } else if (q) used ??= 'kicksdb'
    if (!q) { q = await veilleio(sku, sizeEu); if (q && q !== 'subscription') used = used ?? 'veilleio' }

    if (q && q !== 'subscription') {
      await prisma.purchase.update({ where: { id: p.id }, data: { marketPrice: q.price, marketUpdatedAt: now } })
      updated++
    }
  }

  if (updated === 0 && subscription && !process.env.RAPIDAPI_KEY) {
    return NextResponse.json({ error: 'subscription' }, { status: 402 })
  }
  return NextResponse.json({ updated, total: pairs.length, subscription, provider: used })
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return refresh({ userId: user.id })
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return refresh({})
}
