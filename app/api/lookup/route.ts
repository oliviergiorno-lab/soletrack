import { NextResponse } from 'next/server'

/**
 * GET /api/lookup?gtin=194275007359            → KicksDB /unified/gtin (abonnement requis → 402)
 * GET /api/lookup?gtin=194275007359&sku=CT5053-001 → veilleio : produit par SKU, pointure via le GTIN du variant
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

type Lookup = {
  sku: string
  brand: string
  model: string
  colorway: string
  thumbnail: string | null
  size: string | null
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

function normalizeKicks(raw: any, gtin: string): Lookup | null {
  const list = Array.isArray(raw?.data) ? raw.data : raw?.data ? [raw.data] : Array.isArray(raw) ? raw : raw ? [raw] : []
  if (!list.length) return null
  const hit = list[0]
  const product = hit.product ?? hit
  const brand: string = product.brand ?? ''
  const title: string = product.primary_title ?? product.title ?? product.name ?? ''
  const model = brand && title.toLowerCase().startsWith(brand.toLowerCase()) ? title.slice(brand.length).trim() : title
  const colorway: string = product.secondary_title ?? product.colorway ?? ''
  const sku: string = product.sku ?? product.style_id ?? ''
  const thumbnail: string | null = product.image ?? product.thumbnail ?? null
  let size: string | null = null
  const variants = hit.variants ?? product.variants ?? []
  const variant = variants.find((v: any) =>
    (v.gtins ?? v.identifiers ?? []).some((g: any) => String(g.identifier ?? g.value ?? g) === gtin)
  ) ?? hit.variant ?? null
  if (variant) {
    const eu = (variant.sizes ?? []).find((s: any) => String(s.type ?? '').toLowerCase() === 'eu')
    size = eu?.size ?? variant.size_eu ?? variant.eu ?? variant.size ?? null
  } else {
    size = hit.size_eu ?? hit.size ?? null
  }
  if (size && !/^EU/i.test(String(size))) size = `EU ${size}`
  if (!sku && !title) return null
  return { sku, brand, model, colorway, thumbnail, size }
}

async function viaKicks(gtin: string) {
  const key = process.env.KICKSDB_API_KEY
  if (!key) return NextResponse.json({ error: 'config' }, { status: 500 })
  const res = await fetch(`https://api.kicks.dev/v3/unified/gtin?query=${encodeURIComponent(gtin)}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store',
  })
  if (res.status === 403) return NextResponse.json({ error: 'subscription' }, { status: 402 })
  if (!res.ok) return NextResponse.json({ error: 'upstream', status: res.status }, { status: 502 })
  const product = normalizeKicks(await res.json(), gtin)
  if (!product) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(product)
}

async function viaVeilleio(gtin: string, sku: string) {
  const key = process.env.RAPIDAPI_KEY
  if (!key) return NextResponse.json({ error: 'config' }, { status: 500 })
  const h = { 'x-rapidapi-key': key, 'x-rapidapi-host': 'stockx1.p.rapidapi.com' }
  const base = 'https://stockx1.p.rapidapi.com/v2/stockx'

  const r1 = await fetch(`${base}/search?query=${encodeURIComponent(sku)}&limit=5`, { headers: h, cache: 'no-store' })
  if (!r1.ok) return NextResponse.json({ error: 'upstream', status: r1.status }, { status: 502 })
  const list: any[] = await r1.json()
  const hit = (Array.isArray(list) ? list : []).find(x => String(x.sku ?? '').toUpperCase() === sku) ?? list?.[0]
  if (!hit?.slug) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  await sleep(1100)
  const r2 = await fetch(`${base}/product?query=${encodeURIComponent(hit.slug)}&currency=EUR&country=FR`, { headers: h, cache: 'no-store' })
  if (!r2.ok) return NextResponse.json({ error: 'upstream', status: r2.status }, { status: 502 })
  const p = await r2.json()
  if (p?.sku && String(p.sku).toUpperCase() !== sku) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const variant = (p?.variants ?? []).find((v: any) => (v.gtins ?? []).some((g: any) => String(g.identifier) === gtin))
  if (!variant) return NextResponse.json({ error: 'gtin_mismatch' }, { status: 409 })
  const eu = (variant.sizes ?? []).find((s: any) => s.type === 'eu')?.size ?? null

  return NextResponse.json({
    sku: p.sku ?? sku,
    brand: p.brand ?? '',
    model: p.model ?? p.name ?? '',
    colorway: hit.colorway ?? '',
    thumbnail: p.image ?? hit.image ?? null,
    size: eu ? (/^EU/i.test(String(eu)) ? String(eu) : `EU ${eu}`) : null,
  } satisfies Lookup)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const gtin = (searchParams.get('gtin') || '').replace(/\D/g, '')
  const sku = (searchParams.get('sku') || '').trim().toUpperCase()
  if (gtin.length < 8) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  return sku ? viaVeilleio(gtin, sku) : viaKicks(gtin)
}
