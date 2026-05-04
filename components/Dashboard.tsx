'use client'

import { useMemo } from 'react'

type MarketPrice = {
  stockxPrice: number | null
  goatPrice: number | null
}

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
  marketPrices: MarketPrice[]
}

export default function Dashboard({ purchases }: { purchases: Purchase[] }) {
  const stats = useMemo(() => {
    const inStock = purchases.filter(p => p.status === 'IN_STOCK')
    const sold = purchases.filter(p => p.status === 'SOLD')

    const capitalInvesti = inStock.reduce((s, p) => s + p.totalCost, 0)
    const valeurMarche = inStock.reduce((s, p) => {
      const latest = p.marketPrices[0]
      const price = latest?.stockxPrice ?? latest?.goatPrice ?? 0
      return s + price
    }, 0)
    const pnlRealise = sold.reduce((s, p) => {
      if (!p.sellPrice) return s
      return s + (p.sellPrice - (p.sellFees || 0) - p.totalCost)
    }, 0)

    // Répartition par plateforme
    const platformMap: Record<string, number> = {}
    purchases.forEach(p => {
      platformMap[p.platform] = (platformMap[p.platform] || 0) + 1
    })

    // Top opportunités
    const opportunities = inStock
      .map(p => {
        const latest = p.marketPrices[0]
        const marketPrice = latest?.stockxPrice ?? latest?.goatPrice ?? null
        if (!marketPrice) return null
        const margin = marketPrice - p.totalCost
        const marginPct = p.totalCost > 0 ? (margin / p.totalCost) * 100 : 0
        return { ...p, marketPrice, margin, marginPct }
      })
      .filter(Boolean)
      .sort((a, b) => b!.marginPct - a!.marginPct)
      .slice(0, 3) as any[]

    return { inStock, sold, capitalInvesti, valeurMarche, pnlRealise, platformMap, opportunities }
  }, [purchases])

  // Camembert SVG simple
  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  const platformEntries = Object.entries(stats.platformMap)
  const total = platformEntries.reduce((s, [, v]) => s + v, 0)

  let cumulAngle = 0
  const slices = platformEntries.map(([name, count], i) => {
    const pct = count / total
    const startAngle = cumulAngle
    cumulAngle += pct * 2 * Math.PI
    const endAngle = cumulAngle
    const x1 = 50 + 40 * Math.sin(startAngle)
    const y1 = 50 - 40 * Math.cos(startAngle)
    const x2 = 50 + 40 * Math.sin(endAngle)
    const y2 = 50 - 40 * Math.cos(endAngle)
    const largeArc = pct > 0.5 ? 1 : 0
    return { name, count, pct, x1, y1, x2, y2, largeArc, color: COLORS[i % COLORS.length] }
  })

  return (
    <div className="mb-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Capital investi', value: `€${stats.capitalInvesti.toFixed(0)}`, sub: `${stats.inStock.length} paires en stock`, color: 'text-white' },
          { label: 'Valeur marché', value: `€${stats.valeurMarche.toFixed(0)}`, sub: 'Prix StockX/GOAT actuel', color: 'text-blue-400' },
          { label: 'Plus-value latente', value: `${stats.valeurMarche - stats.capitalInvesti >= 0 ? '+' : ''}€${(stats.valeurMarche - stats.capitalInvesti).toFixed(0)}`, sub: 'Si tout vendu maintenant', color: stats.valeurMarche >= stats.capitalInvesti ? 'text-green-400' : 'text-red-400' },
          { label: 'P&L réalisé', value: `${stats.pnlRealise >= 0 ? '+' : ''}€${stats.pnlRealise.toFixed(0)}`, sub: `${stats.sold.length} paires vendues`, color: stats.pnlRealise >= 0 ? 'text-green-400' : 'text-red-400' },
        ].map((kpi, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">{kpi.label}</div>
            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs text-zinc-600 mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Camembert */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Répartition par plateforme</h3>
          {total === 0 ? (
            <p className="text-zinc-500 text-sm">Aucune donnée</p>
          ) : (
            <div className="flex items-center gap-6">
              <svg viewBox="0 0 100 100" className="w-32 h-32 flex-shrink-0">
                {slices.map((slice, i) => (
                  slice.pct === 1 ? (
                    <circle key={i} cx="50" cy="50" r="40" fill={slice.color} />
                  ) : (
                    <path
                      key={i}
                      d={`M 50 50 L ${slice.x1} ${slice.y1} A 40 40 0 ${slice.largeArc} 1 ${slice.x2} ${slice.y2} Z`}
                      fill={slice.color}
                    />
                  )
                ))}
              </svg>
              <div className="flex flex-col gap-2">
                {slices.map((slice, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }} />
                    <span className="text-sm text-zinc-300">{slice.name}</span>
                    <span className="text-xs text-zinc-500 ml-1">{slice.count} ({Math.round(slice.pct * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top opportunités */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">🔥 Top opportunités</h3>
          {stats.opportunities.length === 0 ? (
            <p className="text-zinc-500 text-sm">Aucune opportunité détectée — mettez à jour les prix</p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.opportunities.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white font-medium">{p.brand} {p.model}</div>
                    <div className="text-xs text-zinc-500">{p.colorway}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-mono font-bold">+€{p.margin.toFixed(0)}</div>
                    <div className="text-xs text-zinc-500">+{p.marginPct.toFixed(0)}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
