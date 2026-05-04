import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const purchases = await prisma.purchase.findMany({
    where: { status: 'IN_STOCK' },
  })

  for (const purchase of purchases) {
    try {
      const response = await fetch(
        `https://api.kicks.dev/v3/stockx/products?query=${encodeURIComponent(
          `${purchase.brand} ${purchase.model} ${purchase.colorway}`
        )}&currency=EUR&market=FR`,
        {
          headers: {
            Authorization: `Bearer ${process.env.KICKSDB_API_KEY}`,
          },
        }
      )

      const data = await response.json()
      const product = data?.data?.[0]

      if (!product) continue

      const stockxPrice = product.min_price > 0 ? product.min_price : null
      const goatPrice = product.avg_price > 0 ? product.avg_price : null
      const marketPrice = stockxPrice ?? goatPrice

      await prisma.marketPrice.create({
        data: {
          purchaseId: purchase.id,
          stockxPrice,
          goatPrice,
        },
      })

      if (marketPrice && marketPrice > purchase.totalCost) {
        await prisma.alert.create({
          data: {
            purchaseId: purchase.id,
            marketPrice,
          },
        })
      }
    } catch (error) {
      console.error(`Erreur pour ${purchase.model}:`, error)
      continue
    }
  }

  return NextResponse.json({ success: true })
}
