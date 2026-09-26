'use client'

import { useMemo } from 'react'
import PortfolioChart, { type Point } from './PortfolioChart'

type P = { totalCost: number; status: string; sellPrice: number | null; sellFees: number | null; purchasedAt: string; soldAt: string | null }

const eur = (n: number) => '€' + Math.round(n).toLocaleString('fr-FR')

export default function StatsView({ purchases }: { purchases: P[] }) {
  const s = useMemo(() => {
    const sold = purchases.filter(p => p.status === 'SOLD' && p.sellPrice)
    const investiTotal = purchases.reduce((a, p) => a + p.totalCost, 0)
    const ticket = purchases.length ? investiTotal / purchases.length : 0
    const pnl = sold.reduce((a, p) => a + (p.sellPrice! - (p.sellFees || 0) - p.totalCost), 0)
    const coutVendu = sold.reduce((a, p) => a + p.totalCost, 0)
    const marge = coutVendu ? (pnl / coutVendu) * 100 : 0
    const delais = sold.filter(p => p.soldAt).map(p => (new Date(p.soldAt!).getTime() - new Date(p.purchasedAt).getTime()) / 86400000)
    const delai = delais.length ? delais.reduce((a, b) => a + b, 0) / delais.length : null

    const sorted = [...purchases].sort((a, b) => new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime())
    let cum = 0
    const points: Point[] = sorted.map(p => { cum += p.totalCost; return { date: p.purchasedAt, value: cum } })
    if (points.length) points.push({ date: new Date().toISOString(), value: cum })

    return { n: purchases.length, investiTotal, ticket, marge, delai, sold: sold.length, points }
  }, [purchases])

  const tiles = [
    { label: 'Paires achetées', value: String(s.n), sub: `${eur(s.investiTotal)} investis au total` },
    { label: "Ticket moyen d'achat", value: eur(s.ticket), sub: 'coût complet, frais inclus' },
    { label: 'Marge moyenne réalisée', value: s.sold ? `${s.marge >= 0 ? '+' : '−'}${Math.abs(s.marge).toFixed(1).replace('.', ',')} %` : '—', sub: `${s.sold} vente${s.sold > 1 ? 's' : ''}` },
    { label: 'Délai moyen de revente', value: s.delai != null ? `${Math.round(s.delai)} j` : '—', sub: 'entre achat et vente' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(t => (
          <div key={t.label} className="rounded-xl border border-line bg-surface p-4 shadow-card">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">{t.label}</div>
            <div className="text-2xl font-bold tracking-tight tabular text-ink">{t.value}</div>
            <div className="mt-1 text-xs text-muted">{t.sub}</div>
          </div>
        ))}
      </div>
      <PortfolioChart points={s.points} title="Évolution du capital investi" />
    </div>
  )
}
