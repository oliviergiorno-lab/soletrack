import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import PurchaseList from '@/components/PurchaseList'
import AddPurchaseForm from '@/components/AddPurchaseForm'
import Dashboard from '@/components/Dashboard'

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

  const inStock = purchases.filter(p => p.status === 'IN_STOCK').length
  const period = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date())

  return (
    <div className="min-h-screen bg-bg md:grid md:grid-cols-[212px_1fr]">
      <Sidebar username={user.username} />

      <main className="min-w-0 px-4 py-5 md:px-7 md:py-6 lg:px-8">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">Dashboard</h1>
            <p className="text-[13px] text-muted">
              Vue d'ensemble de ton activité · {inStock} {inStock > 1 ? 'paires' : 'paire'} en stock
            </p>
          </div>
          <div className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted capitalize">
            {period}
          </div>
        </header>

        <section id="dashboard"><Dashboard purchases={purchases} /></section>
        <section id="achats"><AddPurchaseForm /></section>
        <section id="stock"><PurchaseList purchases={purchases} /></section>
      </main>
    </div>
  )
}
