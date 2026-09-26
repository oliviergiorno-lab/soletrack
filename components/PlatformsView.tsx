'use client'

import { useMemo } from 'react'

type P = { platform: string; totalCost: number; status: string; sellPrice: number | null; sellFees: number | null; sellPlatform: string | null; marketPrice: number | null }

const COLORS = ['#252525', '#7F927D', '#C8C0B2', '#8F8A81', '#B9C9B7', '#DCD6CB']
const eur = (n: number) => '€' + Math.round(n).toLocaleString('fr-FR')
const signed = (n: number) => (n >= 0 ? '+' : '−') + eur(Math.abs(n))

export default function PlatformsView({ purchases }: { purchases: P[] }) {
  const rows = useMemo(() => {
    const map: Record<string, { n: number; stock: number; investi: number; cote: number; vendues: number; pnl: number }> = {}
    for (const p of purchases) {
      const r = (map[p.platform] ??= { n: 0, stock: 0, investi: 0, cote: 0, vendues: 0, pnl: 0 })
      r.n++
      r.investi += p.totalCost
      if (p.status === 'IN_STOCK') { r.stock++; r.cote += p.marketPrice ?? 0 }
      if (p.status === 'SOLD' && p.sellPrice) { r.vendues++; r.pnl += p.sellPrice - (p.sellFees || 0) - p.totalCost }
    }
    return Object.entries(map).sort((a, b) => b[1].n - a[1].n).map(([name, r], i) => ({ name, ...r, color: COLORS[i % COLORS.length] }))
  }, [purchases])

  const sales = useMemo(() => {
    const map: Record<string, { n: number; pnl: number }> = {}
    for (const p of purchases) {
      if (p.status !== 'SOLD' || !p.sellPrice) continue
      const k = p.sellPlatform || 'Non renseigné'
      const r = (map[k] ??= { n: 0, pnl: 0 })
      r.n++; r.pnl += p.sellPrice - (p.sellFees || 0) - p.totalCost
    }
    return Object.entries(map).sort((a, b) => b[1].n - a[1].n)
  }, [purchases])

  const total = purchases.length
  let acc = 0
  const gradient = rows.map(r => { const from = (acc / total) * 100; acc += r.n; return `${r.color} ${from}% ${(acc / total) * 100}%` }).join(', ')

  const th = 'whitespace-nowrap px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted'
  const td = 'whitespace-nowrap px-4 py-3 text-sm tabular'

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_2fr]">
        <div className="rounded-card border border-line bg-surface p-5 shadow-card">
          <h3 className="mb-4 text-[13px] font-semibold text-ink">Achats par plateforme</h3>
          {total === 0 ? <p className="text-sm text-muted">Aucune donnée</p> : (
            <div className="flex items-center gap-5">
              <div className="h-[104px] w-[104px] flex-shrink-0 rounded-full" style={{ background: `conic-gradient(${gradient})`, WebkitMask: 'radial-gradient(circle 33px at 50% 50%, transparent 98%, #000 100%)', mask: 'radial-gradient(circle 33px at 50% 50%, transparent 98%, #000 100%)' }} />
              <div className="flex min-w-0 flex-col gap-2">
                {rows.map(r => (
                  <div key={r.name} className="flex items-center gap-2 text-[12.5px]">
                    <span className="h-[9px] w-[9px] flex-shrink-0 rounded-[3px]" style={{ backgroundColor: r.color }} />
                    <span className="truncate text-ink">{r.name}</span>
                    <span className="ml-auto pl-3 text-muted tabular">{r.n} · {Math.round((r.n / total) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
          <table className="w-full">
            <thead><tr className="border-b border-line">{['Plateforme', 'Paires', 'En stock', 'Investi', 'Cote stock', 'Vendues', 'P&L'].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map(r => (
                <tr key={r.name}>
                  <td className={`${td} font-semibold text-ink`}>{r.name}</td>
                  <td className={`${td} text-ink`}>{r.n}</td>
                  <td className={`${td} text-ink`}>{r.stock}</td>
                  <td className={`${td} text-ink`}>{eur(r.investi)}</td>
                  <td className={`${td} text-ink`}>{r.cote ? eur(r.cote) : '—'}</td>
                  <td className={`${td} text-ink`}>{r.vendues}</td>
                  <td className={`${td} font-bold ${r.vendues ? (r.pnl >= 0 ? 'text-accent-ink' : 'text-neg') : 'text-muted'}`}>{r.vendues ? signed(r.pnl) : '—'}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-sm text-muted">Aucune donnée</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-card border border-line bg-surface p-5 shadow-card">
        <h3 className="mb-3 text-[13px] font-semibold text-ink">Ventes par plateforme</h3>
        {sales.length === 0 ? <p className="text-sm text-muted">Aucune vente enregistrée</p> : (
          <div className="flex flex-wrap gap-3">
            {sales.map(([name, r]) => (
              <div key={name} className="rounded-xl border border-line px-4 py-3">
                <div className="text-sm font-semibold text-ink">{name}</div>
                <div className="text-xs text-muted">{r.n} vente{r.n > 1 ? 's' : ''} · <span className={r.pnl >= 0 ? 'text-accent-ink' : 'text-neg'}>{signed(r.pnl)}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
