'use client'

import { useState } from 'react'

type Alert = {
  id: number
  marketPrice: number
  triggeredAt: string
  purchase: {
    brand: string
    model: string
    colorway: string
    totalCost: number
  }
}

export default function AlertBanner({ alerts }: { alerts: Alert[] }) {
  const [dismissed, setDismissed] = useState<number[]>([])

  const visible = alerts.filter(a => !dismissed.includes(a.id))

  if (!visible.length) return null

  async function dismiss(id: number) {
    await fetch('/api/alerts', {
      method: 'PATCH',
      body: JSON.stringify({ id }),
      headers: { 'Content-Type': 'application/json' },
    })
    setDismissed(prev => [...prev, id])
  }

  return (
    <div className="mb-8 flex flex-col gap-3">
      {visible.map(alert => (
        <div
          key={alert.id}
          className="flex items-center justify-between bg-green-950 border border-green-500 rounded-lg px-5 py-4"
        >
          <div>
            <span className="text-green-400 font-bold mr-2">🟢 ALERTE VENTE</span>
            <span className="text-white">
              {alert.purchase.brand} {alert.purchase.model} {alert.purchase.colorway}
            </span>
            <span className="text-zinc-400 text-sm ml-3">
              Prix marché : €{alert.marketPrice} — Revient : €{alert.purchase.totalCost}
            </span>
          </div>
          <button
            onClick={() => dismiss(alert.id)}
            className="text-zinc-400 hover:text-white ml-4 text-sm"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
