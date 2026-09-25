'use client'

import { useMemo, useRef, useState } from 'react'

export type Point = { date: string; value: number }

const RANGES = ['7J', '30J', '3M', 'Tout'] as const
type Range = (typeof RANGES)[number]
const DAYS: Record<Range, number | null> = { '7J': 7, '30J': 30, '3M': 90, Tout: null }

const W = 720
const H = 240
const PAD = { l: 56, r: 16, t: 16, b: 28 }

function fmtEUR(n: number) {
  return '€' + Math.round(n).toLocaleString('fr-FR')
}
function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
function niceCeil(v: number) {
  if (v <= 0) return 100
  const step = Math.pow(10, Math.floor(Math.log10(v)))
  const n = Math.ceil(v / step)
  return (n === Math.floor(v / step) ? n + 1 : n) * step
}

export default function PortfolioChart({
  points,
  title = 'Évolution de la valeur de ton stock',
}: {
  points: Point[]
  title?: string
}) {
  const [range, setRange] = useState<Range>('Tout')
  const [hover, setHover] = useState<number | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  const data = useMemo(() => {
    if (!points.length) return []
    const days = DAYS[range]
    if (!days) return points
    const from = Date.now() - days * 864e5
    const inRange = points.filter(p => new Date(p.date).getTime() >= from)
    const before = points.filter(p => new Date(p.date).getTime() < from)
    const base = before.length
      ? [{ date: new Date(from).toISOString(), value: before[before.length - 1].value }]
      : []
    return [...base, ...inRange]
  }, [points, range])

  const n = data.length
  const yMax = niceCeil(Math.max(0, ...data.map(d => d.value)))
  const x = (i: number) => PAD.l + (W - PAD.l - PAD.r) * (n > 1 ? i / (n - 1) : 0)
  const y = (v: number) => PAD.t + (H - PAD.t - PAD.b) * (1 - v / yMax)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => t * yMax)

  const linePath = data.map((d, i) => `${i ? 'L' : 'M'}${x(i)} ${y(d.value)}`).join(' ')
  const areaPath = n > 1 ? `${linePath} L${x(n - 1)} ${y(0)} L${x(0)} ${y(0)} Z` : ''

  function onMove(e: React.MouseEvent | React.TouchEvent) {
    const box = boxRef.current
    if (!box || n < 2) return
    const r = box.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? 0 : e.clientX
    const cx = ((clientX - r.left) / r.width) * W
    const i = Math.round(((cx - PAD.l) / (W - PAD.l - PAD.r)) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, i)))
  }

  const labelIdx = n > 2 ? [0, Math.floor((n - 1) / 2), n - 1] : n === 2 ? [0, 1] : [0]

  return (
    <div className="rounded-card border border-line bg-surface p-4 md:p-5 shadow-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-full px-2.5 py-1 text-[11px] transition-colors ${
                range === r ? 'bg-accent-soft font-semibold text-accent-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {n < 2 ? (
        <div className="flex h-[180px] items-center justify-center text-sm text-muted">
          Pas assez de données sur cette période.
        </div>
      ) : (
        <div
          ref={boxRef}
          className="relative"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          onTouchStart={onMove}
          onTouchMove={onMove}
          onTouchEnd={() => setHover(null)}
        >
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-auto w-full overflow-visible" role="img" aria-label={title}>
            <defs>
              <linearGradient id="pc-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--st-accent)" stopOpacity="0.20" />
                <stop offset="100%" stopColor="var(--st-accent)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {ticks.map(t => (
              <g key={t}>
                <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--st-border)" strokeWidth="1" />
                <text x={PAD.l - 8} y={y(t) + 3} textAnchor="end" fontSize="10" fill="var(--st-muted)" className="tabular">
                  {fmtEUR(t)}
                </text>
              </g>
            ))}

            {labelIdx.map(i => (
              <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} fontSize="10" fill="var(--st-muted)">
                {fmtDay(data[i].date)}
              </text>
            ))}

            <path d={areaPath} fill="url(#pc-fill)" />
            <path d={linePath} fill="none" stroke="var(--st-accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={x(n - 1)} cy={y(data[n - 1].value)} r="4.5" fill="var(--st-accent)" stroke="#fff" strokeWidth="2" />

            {hover !== null && (
              <g>
                <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="var(--st-muted)" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx={x(hover)} cy={y(data[hover].value)} r="4" fill="var(--st-accent)" stroke="#fff" strokeWidth="2" />
              </g>
            )}
          </svg>

          {hover !== null && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[130%] whitespace-nowrap rounded-lg bg-side px-2.5 py-1.5 text-[11.5px] text-white shadow-card tabular"
              style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(data[hover].value) / H) * 100}%` }}
            >
              <span className="text-[#B4B0A8]">{fmtDay(data[hover].date)}</span>{' '}
              <b>{fmtEUR(data[hover].value)}</b>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
