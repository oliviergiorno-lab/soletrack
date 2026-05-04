import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const alerts = await prisma.alert.findMany({
    where: { seen: false },
    include: {
      purchase: true,
    },
    orderBy: { triggeredAt: 'desc' },
  })
  return NextResponse.json(alerts)
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { id } = body

  const alert = await prisma.alert.update({
    where: { id },
    data: { seen: true },
  })
  return NextResponse.json(alert)
}
