'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RefreshPrices() {
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  const router = useRouter()

  async function handleRefresh() {
    setLoading(true)
    await fetch('/api/market', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET}`,
      },
    })
    setLoading(false)
    setLastUpdate(new Date().toLocaleTimeString('fr-FR'))
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
      >
        <span className={loading ? 'animate-spin' : ''}>↻</span>
        {loading ? 'Mise à jour...' : 'Mettre à jour les prix'}
      </button>
      {lastUpdate && (
        <span className="text-xs text-zinc-500">Dernière mise à jour : {lastUpdate}</span>
      )}
    </div>
  )
}
