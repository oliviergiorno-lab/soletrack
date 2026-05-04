import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PurchaseList from '@/components/PurchaseList'
import AddPurchaseForm from '@/components/AddPurchaseForm'
import Dashboard from '@/components/Dashboard'
import LogoutButton from '@/components/LogoutButton'

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
  }))

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            SOLE<span className="text-green-400">TRACK</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-zinc-500 text-sm">👋 {user.username}</span>
            <LogoutButton />
          </div>
        </div>
        <Dashboard purchases={purchases} />
        <AddPurchaseForm />
        <PurchaseList purchases={purchases} />
      </div>
    </main>
  )
}
