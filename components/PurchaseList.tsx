'use client'

import React, { useMemo, useState } from 'react'
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
  marketPrice: number | null
}

const STATUS_LABEL: Record<string, string> = { IN_STOCK: 'En stock', SOLD: 'Vendu', RETURNED: 'Retourné' }
const SELL_PLATFORMS = ['StockX', 'GOAT', 'Vinted', 'eBay', 'Direct']

const input =
  'w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent-soft transition'
const select =
  'rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink outline-none focus:border-accent cursor-pointer'
const label = 'text-[11px] font-medium uppercase tracking-wider text-muted'
const btnPrimary =
  'rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-bg hover:bg-ink/90 disabled:opacity-50 transition'
const btnGhost = 'px-3 py-2 text-sm text-muted hover:text-ink transition'

function eur(n: number) {
  return '€' + Math.round(n).toLocaleString('fr-FR')
}
function pct(n: number) {
  return (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(1).replace('.', ',') + ' %'
}

export default function PurchaseList({ purchases }: { purchases: Purchase[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ size: '', buyPrice: '', fees: '' })
  const [filter, setFilter] = useState('ALL')
  const [filterBrand, setFilterBrand] = useState('ALL')
  const [filterSize, setFilterSize] = useState('ALL')
  const [sortPrice, setSortPrice] = useState('NONE')
  const [sellModal, setSellModal] = useState<Purchase | null>(null)
  const [sellForm, setSellForm] = useState({
    sellPrice: '',
    sellFees: '',
    sellPlatform: 'StockX',
    soldAt: new Date().toISOString().split('T')[0],
  })
  const [notesId, setNotesId] = useState<number | null>(null)
  const [notesValue, setNotesValue] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const brands = useMemo(() => ['ALL', ...Array.from(new Set(purchases.map(p => p.brand))).sort()], [purchases])
  const sizes = useMemo(() => ['ALL', ...Array.from(new Set(purchases.map(p => p.size))).sort()], [purchases])

  const filtered = useMemo(() => {
    let r = filter === 'ALL' ? purchases : purchases.filter(p => p.status === filter)
    if (filterBrand !== 'ALL') r = r.filter(p => p.brand === filterBrand)
    if (filterSize !== 'ALL') r = r.filter(p => p.size === filterSize)
    if (sortPrice === 'ASC') r = [...r].sort((a, b) => a.totalCost - b.totalCost)
    if (sortPrice === 'DESC') r = [...r].sort((a, b) => b.totalCost - a.totalCost)
    return r
  }, [purchases, filter, filterBrand, filterSize, sortPrice])

  const counts = {
    ALL: purchases.length,
    IN_STOCK: purchases.filter(p => p.status === 'IN_STOCK').length,
    SOLD: purchases.filter(p => p.status === 'SOLD').length,
    RETURNED: purchases.filter(p => p.status === 'RETURNED').length,
  }

  const pnl = (p: Purchase) => (p.sellPrice ? p.sellPrice - (p.sellFees || 0) - p.totalCost : null)
  // Variation cote vs coût d'achat, uniquement pour les paires en stock cotées
  const delta = (p: Purchase) =>
    p.status === 'IN_STOCK' && p.marketPrice != null && p.totalCost > 0
      ? ((p.marketPrice - p.totalCost) / p.totalCost) * 100
      : null

  async function patch(id: number, body: object) {
    setLoading(id)
    await fetch(`/api/purchases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
    setLoading(null)
    router.refresh()
  }

  function updateStatus(p: Purchase, status: string) {
    if (p.status === 'SOLD' && status === 'IN_STOCK') return
    if (status === 'SOLD' && p.status !== 'SOLD') {
      setSellModal(p)
      setSellForm({ sellPrice: '', sellFees: '', sellPlatform: 'StockX', soldAt: new Date().toISOString().split('T')[0] })
      return
    }
    patch(p.id, { status })
  }

  async function confirmSell() {
    if (!sellModal) return
    await patch(sellModal.id, {
      status: 'SOLD',
      sellPrice: sellForm.sellPrice ? parseFloat(sellForm.sellPrice) : undefined,
      sellFees: sellForm.sellFees ? parseFloat(sellForm.sellFees) : undefined,
      sellPlatform: sellForm.sellPlatform || undefined,
      soldAt: sellForm.soldAt || undefined,
    })
    setSellModal(null)
  }

  async function deleteItem(id: number) {
    setLoading(id)
    await fetch(`/api/purchases/${id}`, { method: 'DELETE' })
    setLoading(null)
    setConfirmDelete(null)
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
    await patch(id, { notes: notesValue })
    setNotesId(null)
  }

  const Thumb = ({ p, size }: { p: Purchase; size: number }) =>
    p.thumbnail ? (
      <Image src={p.thumbnail} alt={p.model} width={size} height={size} className="rounded-[10px] bg-[#EFEBE3] object-contain" />
    ) : (
      <div className="rounded-[10px] bg-[#EFEBE3]" style={{ width: size, height: size }} />
    )

  const StatusSelect = ({ p }: { p: Purchase }) => (
    <select disabled={loading === p.id} value={p.status} onChange={e => updateStatus(p, e.target.value)} className={select}>
      {p.status !== 'SOLD' && <option value="IN_STOCK">En stock</option>}
      <option value="SOLD">Vendu</option>
      <option value="RETURNED">Retourné</option>
    </select>
  )

  const Quote = ({ p, align }: { p: Purchase; align: 'left' | 'right' }) => {
    const d = delta(p)
    if (p.status !== 'IN_STOCK' || p.marketPrice == null) return <span className="text-xs text-muted">—</span>
    return (
      <div className={`tabular ${align === 'right' ? 'text-right' : ''}`}>
        <div className="text-sm font-semibold text-ink">{eur(p.marketPrice)}</div>
        {d !== null && (
          <div className={`text-xs font-semibold ${d >= 0 ? 'text-accent-ink' : 'text-neg'}`}>{pct(d)}</div>
        )}
      </div>
    )
  }

  const Actions = ({ p }: { p: Purchase }) => (
    <div className="flex items-center gap-3 text-xs">
      <button onClick={() => openNotes(p)} className="text-muted hover:text-ink transition" title="Notes">Notes</button>
      {p.status === 'IN_STOCK' && (
        <button onClick={() => openEdit(p)} className="text-muted hover:text-ink transition">Modifier</button>
      )}
      {confirmDelete === p.id ? (
        <span className="flex items-center gap-2">
          <button onClick={() => deleteItem(p.id)} disabled={loading === p.id} className="font-semibold text-neg">Confirmer</button>
          <button onClick={() => setConfirmDelete(null)} className="text-muted">Annuler</button>
        </span>
      ) : (
        <button onClick={() => setConfirmDelete(p.id)} className="text-muted hover:text-neg transition" title="Supprimer">Supprimer</button>
      )}
    </div>
  )

  const EditForm = ({ p }: { p: Purchase }) => (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className={label}>Taille</label>
        <input value={editForm.size} onChange={e => setEditForm(f => ({ ...f, size: e.target.value }))} className={`${input} w-24`} />
      </div>
      <div className="flex flex-col gap-1">
        <label className={label}>Prix achat (€)</label>
        <input type="number" value={editForm.buyPrice} onChange={e => setEditForm(f => ({ ...f, buyPrice: e.target.value }))} className={`${input} w-28`} />
      </div>
      <div className="flex flex-col gap-1">
        <label className={label}>Frais (€)</label>
        <input type="number" value={editForm.fees} onChange={e => setEditForm(f => ({ ...f, fees: e.target.value }))} className={`${input} w-28`} />
      </div>
      <button onClick={() => saveEdit(p.id)} disabled={loading === p.id} className={btnPrimary}>Sauvegarder</button>
      <button onClick={() => setEditId(null)} className={btnGhost}>Annuler</button>
    </div>
  )

  return (
    <div className="mb-10">
      {sellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Enregistrer la vente</h2>
            <p className="mb-5 text-sm text-muted">{sellModal.brand} {sellModal.model} — {sellModal.colorway}</p>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className={label}>Prix de vente (€)</label>
                <input type="number" value={sellForm.sellPrice} onChange={e => setSellForm(f => ({ ...f, sellPrice: e.target.value }))} placeholder="Optionnel" className={input} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={label}>Frais de vente (€)</label>
                <input type="number" value={sellForm.sellFees} onChange={e => setSellForm(f => ({ ...f, sellFees: e.target.value }))} placeholder="Optionnel" className={input} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={label}>Plateforme de vente</label>
                <select value={sellForm.sellPlatform} onChange={e => setSellForm(f => ({ ...f, sellPlatform: e.target.value }))} className={input}>
                  {SELL_PLATFORMS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className={label}>Date de vente</label>
                <input type="date" value={sellForm.soldAt} onChange={e => setSellForm(f => ({ ...f, soldAt: e.target.value }))} className={input} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setSellModal(null)} className={btnGhost}>Annuler</button>
              <button onClick={confirmSell} disabled={loading === sellModal.id} className={btnPrimary}>Confirmer la vente</button>
            </div>
          </div>
        </div>
      )}

      {notesId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-card border border-line bg-surface p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold text-ink">Notes</h2>
            <textarea
              value={notesValue}
              onChange={e => setNotesValue(e.target.value)}
              placeholder="Prix observé, acheteur potentiel, timing de vente…"
              rows={6}
              className={`${input} resize-none`}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setNotesId(null)} className={btnGhost}>Annuler</button>
              <button onClick={() => saveNotes(notesId)} disabled={loading === notesId} className={btnPrimary}>Sauvegarder</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight text-ink">Stock</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value)} className={select}>
            <option value="ALL">Toutes ({counts.ALL})</option>
            <option value="IN_STOCK">En stock ({counts.IN_STOCK})</option>
            <option value="SOLD">Vendues ({counts.SOLD})</option>
            <option value="RETURNED">Retournées ({counts.RETURNED})</option>
          </select>
          <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className={select}>
            {brands.map(b => <option key={b} value={b}>{b === 'ALL' ? 'Toutes marques' : b}</option>)}
          </select>
          <select value={filterSize} onChange={e => setFilterSize(e.target.value)} className={select}>
            {sizes.map(s => <option key={s} value={s}>{s === 'ALL' ? 'Toutes tailles' : s}</option>)}
          </select>
          <select value={sortPrice} onChange={e => setSortPrice(e.target.value)} className={select}>
            <option value="NONE">Prix : défaut</option>
            <option value="ASC">Prix : croissant</option>
            <option value="DESC">Prix : décroissant</option>
          </select>
          {(filterBrand !== 'ALL' || filterSize !== 'ALL' || sortPrice !== 'NONE') && (
            <button onClick={() => { setFilterBrand('ALL'); setFilterSize('ALL'); setSortPrice('NONE') }} className="text-xs text-muted hover:text-ink">
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      <div className="rounded-card border border-line bg-surface shadow-card">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">Aucune paire dans cette catégorie</div>
        ) : (
          <>
            {/* MOBILE */}
            <div className="flex flex-col divide-y divide-line md:hidden">
              {filtered.map(p => {
                const profit = pnl(p)
                return (
                  <div key={p.id} className={`p-4 ${p.status !== 'IN_STOCK' ? 'opacity-70' : ''}`}>
                    <div className="flex items-start gap-3">
                      <Thumb p={p} size={56} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-ink">{p.brand} {p.model}</div>
                        <div className="truncate text-xs text-muted">{p.colorway} · {p.size} · {p.platform}</div>
                        {p.notes && <div className="mt-1 truncate text-xs italic text-muted">{p.notes}</div>}
                      </div>
                      <div className="text-right tabular">
                        <div className="text-[10px] uppercase tracking-wider text-muted">Achat</div>
                        <div className="text-sm font-semibold text-ink">{eur(p.totalCost)}</div>
                        {profit !== null && (
                          <div className={`text-sm font-bold ${profit >= 0 ? 'text-accent-ink' : 'text-neg'}`}>{profit >= 0 ? '+' : '−'}{eur(Math.abs(profit))}</div>
                        )}
                      </div>
                    </div>
                    {p.status === 'IN_STOCK' && p.marketPrice != null && (
                      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                        <span className="text-[10px] uppercase tracking-wider text-muted">Cote StockX</span>
                        <Quote p={p} align="right" />
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                      <StatusSelect p={p} />
                      <Actions p={p} />
                    </div>
                    {editId === p.id && <div className="mt-3 border-t border-line pt-3"><EditForm p={p} /></div>}
                  </div>
                )
              })}
            </div>

            {/* DESKTOP */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line">
                    {['Sneaker', 'Taille', 'Fournisseur', 'Achat', 'Cote', 'Vente', 'P&L', 'Statut', ''].map((h, i) => (
                      <th key={i} className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map(p => {
                    const profit = pnl(p)
                    return (
                      <React.Fragment key={p.id}>
                        <tr className={`transition-colors hover:bg-bg ${p.status !== 'IN_STOCK' ? 'opacity-70' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Thumb p={p} size={48} />
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-ink">{p.brand} {p.model}</div>
                                <div className="truncate text-xs text-muted">{p.colorway}{p.orderNumber ? ` · ${p.orderNumber}` : ''}</div>
                                {p.notes && <div className="mt-0.5 max-w-xs truncate text-xs italic text-muted">{p.notes}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-ink">{p.size}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">{p.platform}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-ink tabular">{eur(p.totalCost)}</td>
                          <td className="whitespace-nowrap px-4 py-3"><Quote p={p} align="left" /></td>
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-muted tabular">
                            {p.status === 'SOLD' && p.sellPrice
                              ? <>{eur(p.sellPrice)}{p.sellFees ? ` (−${eur(p.sellFees)})` : ''}{p.sellPlatform ? ` · ${p.sellPlatform}` : ''}</>
                              : '—'}
                          </td>
                          <td className={`whitespace-nowrap px-4 py-3 text-sm font-bold tabular ${profit === null ? 'text-muted' : profit >= 0 ? 'text-accent-ink' : 'text-neg'}`}>
                            {profit === null ? '—' : <>{profit >= 0 ? '+' : '−'}{eur(Math.abs(profit))}</>}
                          </td>
                          <td className="px-4 py-3"><StatusSelect p={p} /></td>
                          <td className="px-4 py-3"><Actions p={p} /></td>
                        </tr>
                        {editId === p.id && (
                          <tr className="bg-bg">
                            <td colSpan={9} className="px-4 py-4"><EditForm p={p} /></td>
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
    </div>
  )
}
