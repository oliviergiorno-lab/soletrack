import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  if (!query || query.length < 3) return NextResponse.json([])

  const response = await fetch(
    `https://api.kicks.dev/v3/stockx/products?query=${encodeURIComponent(query)}&currency=EUR&market=FR`,
    {
      headers: {
        Authorization: `Bearer ${process.env.KICKSDB_API_KEY}`,
      },
    }
  )

  const data = await response.json()

  const products = data?.data?.slice(0, 8).map((p: any) => ({
    sku: p.sku,
    brand: p.brand,
    model: p.primary_title.replace(p.brand, '').trim(),
    colorway: p.secondary_title,
    thumbnail: p.image ?? null,
  })) ?? []

  return NextResponse.json(products)
}
