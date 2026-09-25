import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const BASE = 'https://api.kicks.dev/v3'
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

function num(s: unknown): number | null {
  const m = String(s ?? '').replace(',', '.').match(/\d+(\.\d+)?/)
  return m ? parseFloat(m[0]) : null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function variantEu(v: any): number | null {
  const fromList = (v.sizes ?? []).find((s: any) => String(s.type ?? '').toLowerCase() === 'eu')?.size
  const raw = v.size_eu ?? v.eu ?? fromList ?? (/^eu/i.test(String(v.size ?? '')) ? v.size : null) ?? (/^eu/i.test(String(v.name ?? '')) ? v.name : null)
  return num(raw)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function variantPrice(v: any): number | null {
  const c = v.lowest_ask ?? v.market?.lowest_ask ?? v.market?.bids?.lowest_ask ?? v.lowest_price?.amount ?? v.lowest_price ?? v.ask?.amount ?? v.price
  const n = typeof c === 'number' ? c : num(c)
  return n && n > 0 ? n : null
}

async function kicks(path: string, key: string) {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' })
  return res
}

async function refresh(where: { userId?: number }) {
  const key = process.env.KICKSDB_API_KEY
  if (!key) return { status: 500, body: { error: 'config' } }

  const stock = await prisma.purchase.findMany({
    where: { ...where, status: 'IN_STOCK', sku: { not: null } },
    select: { id: true, sku: true, size: true },
  })
  if (!stock.length) return { status: 200, body: { updated: 0, total: 0 } }

  const bySku = new Map<string, typeof stock>()
  for (const p of stock) {
    const k = p.sku!.trim().toUpperCase()
    bySku.set(k, [...(bySku.get(k) ?? []), p])
  }

  let updated = 0
  let subscription = false
  const now = new Date()

  for (const [sku, pairs] of bySku) {
    // 1) produit → id
    const s = await kicks(`/stockx/products?query=${encodeURIComponent(sku)}&currency=EUR&market=FR`, key)
    if (s.status === 403) { subscription = true; break }
    if (!s.ok) { await sleep(300); continue }
    const sj = await s.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = (sj?.data ?? []).find((p: any) => String(p.sku ?? '').toUpperCase() === sku) ?? sj?.data?.[0]
    if (!product?.id && !product?.slug) { await sleep(300); continue }

    // 2) variantes → prix par pointure
    await sleep(300)
    const v = await kicks(`/stockx/products/${encodeURIComponent(product.id ?? product.slug)}/variants?currency=EUR&market=FR`, key)
    if (v.status === 403) { subscription = true; break }
    if (!v.ok) { await sleep(300); continue }
    const vj = await v.json()
    const variants = Array.isArray(vj?.data) ? vj.data : Array.isArray(vj) ? vj : []

    for (const p of pairs) {
      const want = num(p.size)
      if (want === null) continue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const match = variants.find((x: any) => variantEu(x) === want)
      const price = match ? variantPrice(match) : null
      if (price === null) continue
      await prisma.purchase.update({ where: { id: p.id }, data: { marketPrice: price, marketUpdatedAt: now } })
      updated++
    }
    await sleep(300)
  }

  if (subscription && updated === 0) return { status: 402, body: { error: 'subscription' } }
  return { status: 200, body: { updated, total: stock.length, subscription } }
}

// Bouton / rafraîchissement à l'ouverture : uniquement le stock de l'utilisateur connecté
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const r = await refresh({ userId: user.id })
  return NextResponse.json(r.body, { status: r.status })
}

// Cron quotidien (Vercel envoie Authorization: Bearer CRON_SECRET) : tout le stock
export async function GET(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const r = await refresh({})
  return NextResponse.json(r.body, { status: r.status })
}
