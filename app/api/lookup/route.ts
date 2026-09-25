import { NextResponse } from 'next/server'

type Lookup = {
  sku: string
  brand: string
  model: string
  colorway: string
  thumbnail: string | null
  size: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(raw: any, gtin: string): Lookup | null {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const variant = variants.find((v: any) =>
    (v.gtins ?? v.identifiers ?? []).some((g: any) => String(g.identifier ?? g.value ?? g) === gtin)
  ) ?? hit.variant ?? null
  if (variant) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eu = (variant.sizes ?? []).find((s: any) => String(s.type ?? '').toLowerCase() === 'eu')
    size = eu?.size ?? variant.size_eu ?? variant.eu ?? variant.size ?? null
  } else {
    size = hit.size_eu ?? hit.size ?? null
  }
  if (size && !/^EU/i.test(String(size))) size = `EU ${size}`

  if (!sku && !title) return null
  return { sku, brand, model, colorway, thumbnail, size }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const gtin = (searchParams.get('gtin') || '').replace(/\D/g, '')
  if (gtin.length < 8) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  const key = process.env.KICKSDB_API_KEY
  if (!key) return NextResponse.json({ error: 'config' }, { status: 500 })

  const res = await fetch(`https://api.kicks.dev/v3/unified/gtin?query=${encodeURIComponent(gtin)}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store',
  })

  if (res.status === 403) return NextResponse.json({ error: 'subscription' }, { status: 402 })
  if (!res.ok) return NextResponse.json({ error: 'upstream', status: res.status }, { status: 502 })

  const raw = await res.json()
  const product = normalize(raw, gtin)
  if (!product) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  return NextResponse.json(product)
}
