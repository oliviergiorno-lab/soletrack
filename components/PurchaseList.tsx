'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type MarketPrice = {
  stockxPrice: number | null
  goatPrice: number | null
  fetchedAt: string
}

type Alert = {
  id: number
  marketPrice: number
}

type Purchase = {
  id: number
  brand: string
  model: string
  colorway: string
  size: string
  thumbnail: string | null
  orderNumber: string | null
  platform: string
  buyPrice: number
  fees: number
  totalCost: number
  status: string
  sellPrice: number | null
  sellFees: number | null
  sellPlatform: string | null
  soldAt: string | null
  purchasedAt: string
  marketPrices: MarketPrice[]
  alerts: Alert[]
}

export default function PurchaseList({ purchases }: { purchases: Purchase[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ size: '', buyPrice: '', fees: '' })
  const [filter, setFilter] = useState<string>('ALL')
  const [sellModal, setSellModal] = useState<Purchase | null>(null)
  const [sellForm, setSellForm] = useState({
    sellPrice: '',
    sellFees: '',
    sellPlatform: 'StockX',
    soldAt: new Date().toISOString().split('T')[0],
  })

  const filtered = filter === 'ALL' ? purchases : purchases.filter(p => p.status === filter)

  async function updateStatus(id: number, status: string, purchase: Purchase) {
    if (purchase.status === 'SOLD' && status === 'IN_STOCK') return
    if (status === 'SOLD' && purchase.status !== 'SOLD') {
      setSellModal(purchase)
      setSellForm({
        sellPrice: '',
        sellFees: '',
        sellPlatform: 'StockX',
        soldAt: new Date().toISOString().split('T')[0],
      })
      return
    }
    setLoading(id)
    await fetch(`/api/purchases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      headers: { 'Content-Type': 'application/json' },
    })
    setLoading(null)
    router.refresh()
  }

  async function confirmSell() {
    if (!sellModal) return
    setLoading(sellModal.id)
    await fetch(`/api/purchases/${sellModal.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'SOLD',
        sellPrice: sellForm.sellPrice ? parseFloat(sellForm.sellPrice) : undefined,
        sellFees: sellForm.sellFees ? parseFloat(sellForm.sellFees) : undefined,
        sellPlatform: sellForm.sellPlatform || undefined,
        soldAt: sellForm.soldAt || undefined,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    setSellModal(null)
    setLoading(null)
    router.refresh()
  }

  async function deleteItem(id: number) {
    if (!confirm('Supprimer cet achat ? Cette action est irréversible.')) return
    setLoading(id)
    await fetch(`/api/purchases/${id}`, { method: 'DELETE' })
    setLoading(null)
    router.refresh()
  }

  function openEdit(p: Purchase) {
    setEditId(p.id)
    setEditForm({ size: p.size, buyPrice: String(p.buyPrice), fees: String(p.fees) })
  }

  async function saveEdit(id: number) {
    setLoading(id)
    await fetch(`/api/purchases/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        size: editForm.size,
        buyPrice: parseFloat(editForm.buyPrice),
        fees: parseFloat(editForm.fees) || 0,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    setEditId(null)
    setLoading(null)
    router.refresh()
  }

  const counts = {
    ALL: purchases.length,
    IN_STOCK: purchases.filter(p => p.status === 'IN_STOCK').length,
    SOLD: purchases.filter(p => p.status === 'SOLD').length,
    RETURNED: purchases.filter(p => p.status === 'RETURNED').length,
  }

  return (
    <div>
      {/* Modale de vente */}
      {sellModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-1">Enregistrer la vente</h2>
            <p className="text-zinc-400 text-sm mb-6">{sellModal.brand} {sellModal.model} — {sellModal.colorway}</p>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Prix de vente (€)</label>
                <input
                  type="number"
                  value={sellForm.sellPrice}
                  onChange={e => setSellForm(prev => ({ ...prev, sellPrice: e.target.value }))}
                  placeholder="Optionnel"
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Frais de vente (€)</label>
                <input
                  type="number"
                  value={sellForm.sellFees}
                  onChange={e => setSellForm(prev => ({ ...prev, sellFees: e.target.value }))}
                  placeholder="Optionnel"
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Plateforme de vente</label>
                <select
                  value={sellForm.sellPlatform}
                  onChange={e => setSellForm(prev => ({ ...prev, sellPlatform: e.target.value }))}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                >
                  <option>StockX</option>
                  <option>GOAT</option>
                  <option>Vinted</option>
                  <option>eBay</option>
                  <option>Direct</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Date de vente</label>
                <input
                  type="date"
                  value={sellForm.soldAt}
                  onChange={e => setSellForm(prev => ({ ...prev, soldAt: e.target.value }))}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setSellModal(null)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmSell}
                disabled={loading === sellModal.id}
                className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold px-5 py-2 rounded-lg text-sm transition-colors"
              >
                Confirmer la vente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtre */}
      <div className="flex items-center gap-4 mb-4">
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none cursor-pointer"
        >
          <option value="ALL">Toutes ({counts.ALL})</option>
          <option value="IN_STOCK">En stock ({counts.IN_STOCK})</option>
          <option value="SOLD">Vendues ({counts.SOLD})</option>
          <option value="RETURNED">Retournées ({counts.RETURNED})</option>
        </select>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-zinc-500">
            Aucune paire dans cette catégorie
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Sneaker', '', 'Taille', 'Fournisseur', 'Prix revient', 'StockX', 'GOAT', 'Revente', 'P&L', 'Statut', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs text-zinc-500 uppercase tracking-wider font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const latest = p.marketPrices[0]
                const marketPrice = latest?.stockxPrice ?? latest?.goatPrice ?? null
                const hasAlert = p.alerts.length > 0
                const margin = marketPrice ? marketPrice - p.totalCost : null
                const isEditing = editId === p.id
                const pnl = p.sellPrice ? p.sellPrice - (p.sellFees || 0) - p.totalCost : null

                return (
                  <React.Fragment key={p.id}>
                    <tr className={`border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors ${p.status === 'SOLD' ? 'opacity-60' : ''} ${p.status === 'RETURNED' ? 'opacity-40' : ''}`}>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-white">{p.brand} {p.model}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{p.colorway}{p.orderNumber ? ` · ${p.orderNumber}` : ''}</div>
                      </td>
                      <td className="px-2 py-4">
                        {p.thumbnail ? (
                          <Image src={p.thumbnail} alt={p.model} width={56} height={56} className="object-contain rounded" />
                        ) : (
                          <div className="w-14 h-14 bg-zinc-800 rounded" />
                        )}
                      </td>
                      <td className="px-4 py-4 text-zinc-300 whitespace-nowrap">{p.size}</td>
                      <td className="px-4 py-4 text-zinc-300 whitespace-nowrap">{p.platform}</td>
                      <td className="px-4 py-4 font-mono text-zinc-300 whitespace-nowrap">€{p.totalCost.toFixed(2)}</td>
                      <td className="px-4 py-4 font-mono text-zinc-300 whitespace-nowrap">
                        {latest?.stockxPrice ? `€${latest.stockxPrice}` : '—'}
                      </td>
                      <td className="px-4 py-4 font-mono text-zinc-300 whitespace-nowrap">
                        {latest?.goatPrice ? `€${latest.goatPrice.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {p.status === 'SOLD' && p.sellPrice ? (
                          <span className="text-zinc-300 font-mono text-xs">
                            €{p.sellPrice.toFixed(0)}{p.sellFees ? ` (-€${p.sellFees})` : ''}
                            {p.sellPlatform ? ` · ${p.sellPlatform}` : ''}
                          </span>
                        ) : p.status !== 'IN_STOCK' ? (
                          <span className="text-zinc-500 text-sm">—</span>
                        ) : marketPrice === null ? (
                          <span className="text-zinc-500 text-sm">En attente</span>
                        ) : hasAlert ? (
                          <span className="bg-green-950 text-green-400 border border-green-700 px-2 py-1 rounded text-xs font-medium">
                            🟢 VENDRE +€{margin?.toFixed(0)}
                          </span>
                        ) : margin !== null && margin > 0 ? (
                          <span className="bg-yellow-950 text-yellow-400 border border-yellow-700 px-2 py-1 rounded text-xs font-medium">
                            🟡 +€{margin.toFixed(0)}
                          </span>
                        ) : (
                          <span className="bg-red-950 text-red-400 border border-red-700 px-2 py-1 rounded text-xs font-medium">
                            🔴 -{Math.abs(margin ?? 0).toFixed(0)}€
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap font-mono">
                        {pnl !== null ? (
                          <span className={pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {pnl >= 0 ? '+' : ''}€{pnl.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-zinc-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          disabled={loading === p.id}
                          value={p.status}
                          onChange={e => updateStatus(p.id, e.target.value, p)}
                          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none cursor-pointer"
                        >
                          <option value="IN_STOCK" style={p.status === 'SOLD' ? {display: 'none'} : {}}>En stock</option>
                          <option value="SOLD">Vendu</option>
                          <option value="RETURNED">Retourné</option>
                        </select>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2 items-center">
                          {p.status === 'IN_STOCK' && (
                            <button
                              onClick={() => openEdit(p)}
                              className="text-zinc-400 hover:text-white text-xs transition-colors whitespace-nowrap"
                            >
                              Modifier
                            </button>
                          )}
                          <button
                            onClick={() => deleteItem(p.id)}
                            disabled={loading === p.id}
                            className="text-zinc-600 hover:text-red-400 transition-colors text-sm disabled:opacity-50"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isEditing && (
                      <tr className="border-b border-zinc-800 bg-zinc-800/50">
                        <td colSpan={11} className="px-4 py-4">
                          <div className="flex gap-4 items-end">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-zinc-400 uppercase tracking-wider">Taille</label>
                              <input
                                value={editForm.size}
                                onChange={e => setEditForm(prev => ({ ...prev, size: e.target.value }))}
                                className="bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-sm text-white outline-none w-24"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-zinc-400 uppercase tracking-wider">Prix achat (€)</label>
                              <input
                                type="number"
                                value={editForm.buyPrice}
                                onChange={e => setEditForm(prev => ({ ...prev, buyPrice: e.target.value }))}
                                className="bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-sm text-white outline-none w-28"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-zinc-400 uppercase tracking-wider">Frais (€)</label>
                              <input
                                type="number"
                                value={editForm.fees}
                                onChange={e => setEditForm(prev => ({ ...prev, fees: e.target.value }))}
                                className="bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-sm text-white outline-none w-28"
                              />
                            </div>
                            <button
                              onClick={() => saveEdit(p.id)}
                              disabled={loading === p.id}
                              className="bg-green-500 hover:bg-green-400 text-black font-bold px-4 py-2 rounded text-sm transition-colors disabled:opacity-50"
                            >
                              Sauvegarder
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              className="text-zinc-400 hover:text-white text-sm transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
