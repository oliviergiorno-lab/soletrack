import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user?.email! } })
  if (!user) return NextResponse.json({ error: 'User introuvable' }, { status: 404 })

  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id },
    orderBy: { purchasedAt: 'desc' },
  })
  return NextResponse.json(purchases)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user?.email! } })
  if (!user) return NextResponse.json({ error: 'User introuvable' }, { status: 404 })

  const body = await req.json()
  const { brand, model, colorway, sku, thumbnail, size, orderNumber, platform, buyPrice, fees } = body

  const totalCost = buyPrice + (fees || 0)

  const purchase = await prisma.purchase.create({
    data: {
      userId: user.id,
      brand, model, colorway, sku, thumbnail,
      size, orderNumber, platform,
      buyPrice, fees: fees || 0, totalCost,
    },
  })
  return NextResponse.json(purchase, { status: 201 })
}
