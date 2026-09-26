import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const COLS = ['Marque', 'Modèle', 'Coloris', 'SKU', 'Pointure', 'Fournisseur', 'Prix achat', 'Frais', 'Coût total', 'Statut', 'Prix vente', 'Frais vente', 'Plateforme vente', 'Date vente', 'Date achat', 'Cote', 'Notes']

function cell(v: unknown) {
  if (v == null) return ''
  const s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v)
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const rows = await prisma.purchase.findMany({ where: { userId: user.id }, orderBy: { purchasedAt: 'desc' } })
  const lines = rows.map(p => [
    p.brand, p.model, p.colorway, p.sku, p.size, p.platform,
    p.buyPrice, p.fees, p.totalCost, p.status,
    p.sellPrice, p.sellFees, p.sellPlatform, p.soldAt, p.purchasedAt, p.marketPrice, p.notes,
  ].map(cell).join(';'))

  const csv = '\uFEFF' + [COLS.join(';'), ...lines].join('\r\n')
  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="soletrack-${date}.csv"`,
    },
  })
}
