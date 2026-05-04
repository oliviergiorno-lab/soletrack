import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { status, sellPrice, sellFees, sellPlatform, soldAt, notes } = body

  const data: any = {}

  if (status !== undefined) {
    data.status = status
    if (status === 'SOLD') {
      if (sellPrice !== undefined) data.sellPrice = sellPrice
      if (sellFees !== undefined) data.sellFees = sellFees
      if (sellPlatform !== undefined) data.sellPlatform = sellPlatform
      if (soldAt !== undefined) data.soldAt = new Date(soldAt)
    }
    if (status === 'RETURNED' || status === 'IN_STOCK') {
      data.sellPrice = null
      data.sellFees = null
      data.sellPlatform = null
      data.soldAt = null
    }
  }

  if (notes !== undefined) data.notes = notes

  const purchase = await prisma.purchase.update({
    where: { id: parseInt(id) },
    data,
  })
  return NextResponse.json(purchase)
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const purchase = await prisma.purchase.findUnique({
    where: { id: parseInt(id) },
  })
  if (!purchase) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(purchase)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.purchase.delete({
    where: { id: parseInt(id) },
  })
  return NextResponse.json({ success: true })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { size, buyPrice, fees } = body

  const totalCost = buyPrice + (fees || 0)

  const purchase = await prisma.purchase.update({
    where: { id: parseInt(id) },
    data: { size, buyPrice, fees, totalCost },
  })
  return NextResponse.json(purchase)
}
