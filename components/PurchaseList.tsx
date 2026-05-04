'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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
  notes: string | null
  purchasedAt: string
}

export default function PurchaseList({ purchases }: { purchases: Purchase[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ size: '', buyPrice: '', fees: '' })
  const [filter, setFilter] = useState<string>('ALL')
  const [filterBrand, setFilterBrand] = useState<string>('ALL')
  const [filterSize, setFilterSize] = useState<string>('ALL')
  const [sortPrice, setSortPrice] = useState<string>('NONE')
  const [sellModal, setSellModal] = useState<Purchase | null>(null)
  const [sellForm, setSellForm] = useState({
    sellPrice: '',
    sellFees: '',
    sellPlatform: 'StockX',
    soldAt: new Date().toISOString().split('T')[0],
  })
  const [notesId, setNotesId] = useState<number | null>(null)
  const [notesValue, setNotesValue] = useState('')

  const brands = useMemo(() => ['ALL', ...Array.from(new Set(purchases.map(p => p.brand))).sort()], [purchases])
  const sizes = useMemo(() => ['ALL', ...Array.from(new Set(purchases.map(p => p.size))).sort()], [purchases])

  const filtered = useMemo(() => {
    let result = filter === 'ALL' ? purchases : purchases.filter(p => p.status === filter)
    if (filterBrand !== 'ALL') result = result.filter(p => p.brand === filterBrand)
    if (filterSize !== 'ALL') result = result.filter(p => p.size === filterSize)
    if (sortPrice === 'ASC') result = [...result].sort((a, b) => a.totalCost - b.totalCost)
    if (sortPrice === 'DESC') result = [...result].sort((a, b) => b.totalCost - a.totalCost)
    return result
  }, [purchases, filter, filterBrand, filterSize, sortPrice])

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

  function openNotes(p: Purchase) {
    setNotesId(p.id)
    setNotesValue(p.notes || '')
  }

  async function saveNotes(id: number) {
    setLoading(id)
    await fetch(`/api/purchases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ notes: notesValue }),
      headers: { 'Content-Type': 'application/json' },
    })
    setNotesId(null)
    setLoading(null)
    router.refresh()
  }

  const counts = {
    ALL: purchases.length,
    IN_STOCK: purchases.filter(p => p.status === 'IN_STOCK').length,
    SOLD: purchases.filter(p => p.status === 'SOLD').length,
    RETURNED: purchases.filter(p => p.status === 'RETURNED').length,
  }

  const pnl = (p: Purchase) => p.sellPrice ? p.sellPrice - (p.sellFees || 0) - p.totalCost : null

  const SellModal = () => sellModal ? (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-1">Enregistrer la vente</h2>
        <p className="text-zinc-400 text-sm mb-6">{sellModal.brand} {sellModal.model} — {sellModal.colorway}</p>
        <div className="flex flex-col gap-4">
          {[
            { label: 'Prix de vente (€)', key: 'sellPrice', type: 'number', placeholder: 'Optionnel' },
            { label: 'Frais de vente (€)', key: 'sellFees', type: 'number', placeholder: 'Optionnel' },
          ].map(f => (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400 uppercase tracking-wider">{f.label}</label>
              <input type={f.type} value={sellForm[f.key as keyof typeof sellForm] as string} onChange={e => setSellForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400 uppercase tracking-wider">Plateforme de vente</label>
            <select value={sellForm.sellPlatform} onChange={e => setSellForm(prev => ({ ...prev, sellPlatform: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-zinc-500">
              {['StockX', 'GOAT', 'Vinted', 'eBay', 'Direct'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400 uppercase tracking-wider">Date de vente</label>
            <input type="date" value={sellForm.soldAt} onChange={e => setSellForm(prev => ({ ...prev, soldAt: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-zinc-500" />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setSellModal(null)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Annuler</button>
          <button onClick={confirmSell} disabled={loading === sellModal.id} className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold px-5 py-2 rounded-lg text-sm transition-colors">Confirmer la vente</button>
        </div>
      </div>
    </div>
  ) : null

  const NotesModal = () => notesId ? (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Notes</h2>
        <textarea value={notesValue} onChange={e => setNotesValue(e.target.value)} placeholder="Prix observé, acheteur potentiel, timing de vente..." rows={6} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-zinc-500 resize-none" />
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={() => setNotesId(null)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Annuler</button>
          <button onClick={() => saveNotes(notesId)} disabled={loading === notesId} className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold px-5 py-2 rounded-lg text-sm transition-colors">Sauvegarder</button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <div>
      <SellModal />
      <NotesModal />

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {[
          { value: filter, onChange: setFilter, options: [{ v: 'ALL', l: `Toutes (${counts.ALL})` }, { v: 'IN_STOCK', l: `En stock (${counts.IN_STOCK})` }, { v: 'SOLD', l: `Vendues (${counts.SOLD})` }, { v: 'RETURNED', l: `Retournées (${counts.RETURNED})` }] },
          { value: filterBrand, onChange: setFilterBrand, options: brands.map(b => ({ v: b, l: b === 'ALL' ? 'Toutes marques' : b })) },
          { value: filterSize, onChange: setFilterSize, options: sizes.map(s => ({ v: s, l: s === 'ALL' ? 'Toutes tailles' : s })) },
          { value: sortPrice, onChange: setSortPrice, options: [{ v: 'NONE', l: 'Prix : défaut' }, { v: 'ASC', l: 'Prix : croissant' }, { v: 'DESC', l: 'Prix : décroissant' }] },
        ].map((f, i) => (
          <select key={i} value={f.value} onChange={e => f.onChange(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none cursor-pointer">
            {f.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        ))}
        {(filterBrand !== 'ALL' || filterSize !== 'ALL' || sortPrice !== 'NONE') && (
          <button onClick={() => { setFilterBrand('ALL'); setFilterSize('ALL'); setSortPrice('NONE') }} className="text-xs text-zinc-500 hover:text-white transition-colors">Réinitialiser</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24 text-zinc-500">Aucune paire dans cette catégorie</div>
      ) : (
        <>
          {/* VUE MOBILE : cartes */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map(p => {
              const profit = pnl(p)
              return (
                <div key={p.id} className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 ${p.status === 'SOLD' ? 'opacity-60' : ''} ${p.status === 'RETURNED' ? 'opacity-40' : ''}`}>
                  <div className="flex items-start gap-3">
                    {p.thumbnail ? (
                      <Image src={p.thumbnail} alt={p.model} width={64} height={64} className="object-contain rounded flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 bg-zinc-800 rounded flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm">{p.brand} {p.model}</div>
                      <div className="text-xs text-zinc-500">{p.colorway}</div>
                      <div className="flex gap-3 mt-1 text-xs text-zinc-400">
                        <span>{p.size}</span>
                        <span>·</span>
                        <span>{p.platform}</span>
                      </div>
                      {p.notes && <div className="text-xs text-zinc-400 mt-1 italic truncate">📝 {p.notes}</div>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-mono text-sm text-zinc-300">€{p.totalCost.toFixed(0)}</div>
                      {profit !== null && (
                        <div className={`font-mono text-sm font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {profit >= 0 ? '+' : ''}€{profit.toFixed(0)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
                    <select
                      disabled={loading === p.id}
                      value={p.status}
                      onChange={e => updateStatus(p.id, e.target.value, p)}
                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none"
                    >
                      <option value="IN_STOCK" style={p.status === 'SOLD' ? { display: 'none' } : {}}>En stock</option>
                      <option value="SOLD">Vendu</option>
                      <option value="RETURNED">Retourné</option>
                    </select>
                    <div className="flex gap-3">
                      <button onClick={() => openNotes(p)} className="text-zinc-400 hover:text-white text-sm">📝</button>
                      {p.status === 'IN_STOCK' && (
                        <button onClick={() => openEdit(p)} className="text-zinc-400 hover:text-white text-xs">Modifier</button>
                      )}
                      <button onClick={() => deleteItem(p.id)} disabled={loading === p.id} className="text-zinc-600 hover:text-red-400 text-sm">✕</button>
                    </div>
                  </div>
                  {editId === p.id && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-col gap-3">
                      {[
                        { label: 'Taille', key: 'size', type: 'text', w: 'w-full' },
                        { label: 'Prix achat (€)', key: 'buyPrice', type: 'number', w: 'w-full' },
                        { label: 'Frais (€)', key: 'fees', type: 'number', w: 'w-full' },
                      ].map(f => (
                        <div key={f.key} className="flex flex-col gap-1">
                          <label className="text-xs text-zinc-400 uppercase tracking-wider">{f.label}</label>
                          <input type={f.type} value={editForm[f.key as keyof typeof editForm]} onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))} className={`${f.w} bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-sm text-white outline-none`} />
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(p.id)} disabled={loading === p.id} className="bg-green-500 hover:bg-green-400 text-black font-bold px-4 py-2 rounded text-sm flex-1">Sauvegarder</button>
                        <button onClick={() => setEditId(null)} className="text-zinc-400 hover:text-white text-sm px-3">Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* VUE DESKTOP : tableau */}
          <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Sneaker', '', 'Taille', 'Fournisseur', 'Prix revient', 'Vente', 'P&L', 'Statut', ''].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs text-zinc-500 uppercase tracking-wider font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const profit = pnl(p)
                  const isEditing = editId === p.id
                  return (
                    <React.Fragment key={p.id}>
                      <tr className={`border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors ${p.status === 'SOLD' ? 'opacity-60' : ''} ${p.status === 'RETURNED' ? 'opacity-40' : ''}`}>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-white">{p.brand} {p.model}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{p.colorway}{p.orderNumber ? ` · ${p.orderNumber}` : ''}</div>
                          {p.notes && <div className="text-xs text-zinc-400 mt-1 italic truncate max-w-xs">📝 {p.notes}</div>}
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
                        <td className="px-4 py-4 whitespace-nowrap">
                          {p.status === 'SOLD' && p.sellPrice ? (
                            <span className="text-zinc-300 font-mono text-xs">€{p.sellPrice.toFixed(0)}{p.sellFees ? ` (-€${p.sellFees})` : ''}{p.sellPlatform ? ` · ${p.sellPlatform}` : ''}</span>
                          ) : <span className="text-zinc-500 text-sm">—</span>}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap font-mono">
                          {profit !== null ? (
                            <span className={profit >= 0 ? 'text-green-400' : 'text-red-400'}>{profit >= 0 ? '+' : ''}€{profit.toFixed(0)}</span>
                          ) : <span className="text-zinc-500">—</span>}
                        </td>
                        <td className="px-4 py-4">
                          <select disabled={loading === p.id} value={p.status} onChange={e => updateStatus(p.id, e.target.value, p)} className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none cursor-pointer">
                            <option value="IN_STOCK" style={p.status === 'SOLD' ? { display: 'none' } : {}}>En stock</option>
                            <option value="SOLD">Vendu</option>
                            <option value="RETURNED">Retourné</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2 items-center">
                            <button onClick={() => openNotes(p)} className="text-zinc-400 hover:text-white text-xs transition-colors" title="Notes">📝</button>
                            {p.status === 'IN_STOCK' && (
                              <button onClick={() => openEdit(p)} className="text-zinc-400 hover:text-white text-xs transition-colors whitespace-nowrap">Modifier</button>
                            )}
                            <button onClick={() => deleteItem(p.id)} disabled={loading === p.id} className="text-zinc-600 hover:text-red-400 transition-colors text-sm disabled:opacity-50">✕</button>
                          </div>
                        </td>
                      </tr>
                      {isEditing && (
                        <tr className="border-b border-zinc-800 bg-zinc-800/50">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="flex gap-4 items-end">
                              <div className="flex flex-col gap-1">
                                <label className="text-xs text-zinc-400 uppercase tracking-wider">Taille</label>
                                <input value={editForm.size} onChange={e => setEditForm(prev => ({ ...prev, size: e.target.value }))} className="bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-sm text-white outline-none w-24" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs text-zinc-400 uppercase tracking-wider">Prix achat (€)</label>
                                <input type="number" value={editForm.buyPrice} onChange={e => setEditForm(prev => ({ ...prev, buyPrice: e.target.value }))} className="bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-sm text-white outline-none w-28" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs text-zinc-400 uppercase tracking-wider">Frais (€)</label>
                                <input type="number" value={editForm.fees} onChange={e => setEditForm(prev => ({ ...prev, fees: e.target.value }))} className="bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-sm text-white outline-none w-28" />
                              </div>
                              <button onClick={() => saveEdit(p.id)} disabled={loading === p.id} className="bg-green-500 hover:bg-green-400 text-black font-bold px-4 py-2 rounded text-sm transition-colors disabled:opacity-50">Sauvegarder</button>
                              <button onClick={() => setEditId(null)} className="text-zinc-400 hover:text-white text-sm transition-colors">Annuler</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
