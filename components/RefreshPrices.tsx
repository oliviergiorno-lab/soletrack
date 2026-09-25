'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = { lastUpdated: string | null }

const STALE_MS = 12 * 60 * 60 * 1000

function fmt(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

export default function RefreshPrices({ lastUpdated }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const auto = useRef(false)

  async function run() {
    if (busy) return
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch('/api/market', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (res.status === 402) {
        setMsg('Cotes disponibles dès l’activation de l’abonnement KicksDB.')
      } else if (!res.ok) {
        setMsg('Mise à jour impossible pour le moment.')
      } else {
        setMsg(`${data.updated ?? 0}/${data.total ?? 0} paires cotées.`)
        router.refresh()
      }
    } catch {
      setMsg('Mise à jour impossible pour le moment.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (auto.current) return
    auto.current = true
    const stale = !lastUpdated || Date.now() - new Date(lastUpdated).getTime() > STALE_MS
    if (stale) run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink hover:bg-bg disabled:opacity-50 transition"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={busy ? 'animate-spin' : ''}>
          <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
        </svg>
        {busy ? 'Mise à jour…' : 'Mettre à jour les prix'}
      </button>
      <span className="text-xs text-muted">
        {msg || (lastUpdated ? `Cotes du ${fmt(lastUpdated)}` : 'Aucune cote pour le moment')}
      </span>
    </div>
  )
}
