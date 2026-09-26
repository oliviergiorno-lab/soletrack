'use client'

import { useEffect, useState, type ComponentProps } from 'react'
import Dashboard from './Dashboard'
import PurchaseList from './PurchaseList'
import AddPurchaseForm from './AddPurchaseForm'
import StatsView from './StatsView'
import PlatformsView from './PlatformsView'
import RefreshPrices from './RefreshPrices'

type Purchases = ComponentProps<typeof PurchaseList>['purchases']

const TITLES: Record<string, [string, string]> = {
  dashboard: ['Dashboard', "Vue d'ensemble de l'activité"],
  stock: ['Stock', 'Paires en stock et cote du marché'],
  achats: ['Achats', 'Ajouter une paire et historique des achats'],
  ventes: ['Ventes', 'Paires vendues et P&L réalisé'],
  statistiques: ['Statistiques', 'Performance du portefeuille'],
  plateformes: ['Plateformes', 'Où tu achètes, où tu vends'],
  export: ['Export', 'Tes données, chez toi'],
}

export default function AppShell({ purchases, lastUpdated }: { purchases: Purchases; lastUpdated: string | null }) {
  const [view, setView] = useState('dashboard')

  useEffect(() => {
    const apply = () => {
      const v = window.location.hash.replace('#', '')
      setView(TITLES[v] ? v : 'dashboard')
      window.scrollTo({ top: 0 })
    }
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [])

  const inStock = purchases.filter(p => p.status === 'IN_STOCK').length
  const period = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date())
  const [title, sub] = TITLES[view]

  return (
    <main className="min-w-0 px-4 py-5 md:px-7 md:py-6 lg:px-8">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
          <p className="text-[13px] text-muted">{sub} · {inStock} {inStock > 1 ? 'paires' : 'paire'} en stock</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(view === 'dashboard' || view === 'stock') && <RefreshPrices lastUpdated={lastUpdated} />}
          <div className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted capitalize">{period}</div>
        </div>
      </header>

      {view === 'dashboard' && <Dashboard purchases={purchases} />}
      {view === 'stock' && <PurchaseList key="stock" purchases={purchases} initialFilter="IN_STOCK" title="En stock" />}
      {view === 'achats' && (<><AddPurchaseForm /><PurchaseList key="achats" purchases={purchases} initialFilter="ALL" title="Historique des achats" /></>)}
      {view === 'ventes' && <PurchaseList key="ventes" purchases={purchases} initialFilter="SOLD" title="Vendues" />}
      {view === 'statistiques' && <StatsView purchases={purchases} />}
      {view === 'plateformes' && <PlatformsView purchases={purchases} />}
      {view === 'export' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-5 shadow-card">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-ink">Export CSV</h2>
            <p className="text-[13px] text-muted">Toutes tes paires, achats et ventes — ouvrable dans Excel, Numbers ou Google Sheets.</p>
          </div>
          <a href="/api/export" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-bg hover:bg-ink/90 transition">Télécharger le CSV</a>
        </div>
      )}
    </main>
  )
}
