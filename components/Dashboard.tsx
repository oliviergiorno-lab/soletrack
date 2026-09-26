'use client'

import { useMemo } from 'react'
import PortfolioChart, { type Point } from './PortfolioChart'

type Purchase = {
  id: number
  brand: string
  model: string
  colorway: string
  platform: string
  buyPrice: number
  fees: number
  totalCost: number
  status: string
  sellPrice: number | null
  sellFees: number | null
  purchasedAt: string
  marketPrice: number | null
}

const COLORS = ['#252525', '#7F927D', '#C8C0B2', '#8F8A81', '#B9C9B7', '#DCD6CB']

function eur(n: number) {
  return '€' + Math.round(n).toLocaleString('fr-FR')
}
function signed(n: number) {
  return (n >= 0 ? '+' : '−') + eur(Math.abs(n))
}
function pct(n: number) {
  return (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(1).replace('.', ',') + ' %'
}

export default function Dashboard({ purchases }: { purchases: Purchase[] }) {
  const stats = useMemo(() => {
    const inStock = purchases.filter(p => p.status === 'IN_STOCK')
    const sold = purchases.filter(p => p.status === 'SOLD')

    const capitalInvesti = inStock.reduce((s, p) => s + p.totalCost, 0)
    const pnlRealise = sold.reduce((s, p) => {
      if (!p.sellPrice) return s
      return s + (p.sellPrice - (p.sellFees || 0) - p.totalCost)
    }, 0)

    // Cote : uniquement les paires en stock qui ont un prix de marché
    const quoted = inStock.filter(p => p.marketPrice != null)
    const valeurMarche = quoted.reduce((s, p) => s + (p.marketPrice as number), 0)
    const capitalCote = quoted.reduce((s, p) => s + p.totalCost, 0)
    const latente = valeurMarche - capitalCote
    const latentePct = capitalCote > 0 ? (latente / capitalCote) * 100 : 0

    const platformMap: Record<string, number> = {}
    purchases.forEach(p => {
      platformMap[p.platform] = (platformMap[p.platform] || 0) + 1
    })
    const platforms = Object.entries(platformMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({ name, count, color: COLORS[i % COLORS.length] }))
    const total = purchases.length

    const sorted = [...purchases].sort(
      (a, b) => new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime()
    )
    let cum = 0
    const points: Point[] = sorted.map(p => {
      cum += p.totalCost
      return { date: p.purchasedAt, value: cum }
    })
    if (points.length) points.push({ date: new Date().toISOString(), value: cum })

    return { inStock, sold, capitalInvesti, pnlRealise, platforms, total, points, quoted, valeurMarche, latente, latentePct }
  }, [purchases])

  let acc = 0
  const gradient = stats.platforms
    .map(p => {
      const from = (acc / stats.total) * 100
      acc += p.count
      const to = (acc / stats.total) * 100
      return `${p.color} ${from}% ${to}%`
    })
    .join(', ')

  const hasQuotes = stats.quoted.length > 0
  const coverage = `${stats.quoted.length}/${stats.inStock.length} paires cotées`

  const kpis = [
    { label: 'Capital investi', value: eur(stats.capitalInvesti), sub: `${stats.inStock.length} paire${stats.inStock.length > 1 ? 's' : ''} en stock`, tone: 'text-ink', badge: null as string | null },
    { label: 'Valeur de marché', value: hasQuotes ? eur(stats.valeurMarche) : '—', sub: hasQuotes ? coverage : 'Aucune cote pour le moment', tone: hasQuotes ? 'text-ink' : 'text-muted', badge: null },
    { label: 'Plus-value latente', value: hasQuotes ? signed(stats.latente) : '—', sub: hasQuotes ? coverage : 'Aucune cote pour le moment', tone: hasQuotes ? (stats.latente >= 0 ? 'text-accent-ink' : 'text-neg') : 'text-muted', badge: hasQuotes ? pct(stats.latentePct) : null },
    { label: 'P&L réalisé', value: signed(stats.pnlRealise), sub: `${stats.sold.length} paire${stats.sold.length > 1 ? 's' : ''} vendue${stats.sold.length > 1 ? 's' : ''}`, tone: stats.pnlRealise >= 0 ? 'text-accent-ink' : 'text-neg', badge: null },
  ]

  return (
    <div className="mb-8 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(k => (
          <div key={k.label} className="rounded-xl border border-line bg-surface p-4 shadow-card">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">{k.label}</span>
              {k.badge && (
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular ${stats.latente >= 0 ? 'bg-accent-soft text-accent-ink' : 'bg-neg/10 text-neg'}`}>
                  {k.badge}
                </span>
              )}
            </div>
            <div className={`text-2xl font-bold tracking-tight tabular ${k.tone}`}>{k.value}</div>
            <div className="mt-1 text-xs text-muted">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.9fr_1fr]">
        <div id="statistiques" className="min-w-0 scroll-mt-4"><PortfolioChart points={stats.points} title="Évolution du capital investi" /></div>

        <div id="plateformes" className="scroll-mt-4 rounded-card border border-line bg-surface p-4 shadow-card md:p-5">
          <h3 className="mb-4 text-[13px] font-semibold text-ink">Répartition par plateforme</h3>
          {stats.total === 0 ? (
            <p className="text-sm text-muted">Aucune donnée</p>
          ) : (
            <div className="flex items-center gap-5">
              <div
                className="h-[104px] w-[104px] flex-shrink-0 rounded-full"
                style={{
                  background: `conic-gradient(${gradient})`,
                  WebkitMask: 'radial-gradient(circle 33px at 50% 50%, transparent 98%, #000 100%)',
                  mask: 'radial-gradient(circle 33px at 50% 50%, transparent 98%, #000 100%)',
                }}
                role="img"
                aria-label={stats.platforms.map(p => `${p.name} ${Math.round((p.count / stats.total) * 100)}%`).join(', ')}
              />
              <div className="flex min-w-0 flex-col gap-2">
                {stats.platforms.map(p => (
                  <div key={p.name} className="flex items-center gap-2 text-[12.5px]">
                    <span className="h-[9px] w-[9px] flex-shrink-0 rounded-[3px]" style={{ backgroundColor: p.color }} />
                    <span className="truncate text-ink">{p.name}</span>
                    <span className="ml-auto pl-3 text-muted tabular">
                      {p.count} · {Math.round((p.count / stats.total) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
