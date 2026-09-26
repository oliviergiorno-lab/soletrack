import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import AppShell from '@/components/AppShell'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({ where: { email: session.user?.email! } })
  if (!user) redirect('/login')

  const rawPurchases = await prisma.purchase.findMany({
    where: { userId: user.id },
    orderBy: { purchasedAt: 'desc' },
  })

  const purchases = rawPurchases.map(p => ({
    ...p,
    soldAt: p.soldAt?.toISOString() ?? null,
    purchasedAt: p.purchasedAt.toISOString(),
    marketUpdatedAt: p.marketUpdatedAt?.toISOString() ?? null,
  }))

  const lastUpdated = purchases
    .map(p => p.marketUpdatedAt)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1) ?? null

  return (
    <div className="min-h-screen bg-bg md:grid md:grid-cols-[212px_1fr]">
      <Sidebar username={user.username} />
      <AppShell purchases={purchases} lastUpdated={lastUpdated} />
    </div>
  )
}
