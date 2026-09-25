'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import BarcodeScanner from './BarcodeScanner'

type Product = {
  sku: string
  brand: string
  model: string
  colorway: string
  thumbnail: string | null
}

const PLATFORMS = ['StockX', 'GOAT', 'Nike', 'Adidas', 'Foot Locker', 'Vinted', 'eBay', 'Autre']

const input =
  'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent-soft transition'
const label = 'text-[11px] font-medium uppercase tracking-wider text-muted'

export default function AddPurchaseForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [selected, setSelected] = useState<Product | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [scanInfo, setScanInfo] = useState('')
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const [form, setForm] = useState({
    size: '',
    orderNumber: '',
    platform: 'StockX',
    buyPrice: '',
    fees: '',
  })

  useEffect(() => {
    if (!query || query.length < 3 || selected) {
      setResults([])
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(Array.isArray(data) ? data : [])
      } catch {
        setResults([])
      }
      setSearching(false)
    }, 400)
  }, [query, selected])

  function handleSelect(product: Product) {
    setSelected(product)
    setQuery(`${product.brand} ${product.model} ${product.colorway}`)
    setResults([])
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleScan(code: string) {
    setScanInfo(`Code lu : ${code} — identification…`)
    setError('')
    try {
      const res = await fetch(`/api/lookup?gtin=${encodeURIComponent(code)}`)
      if (res.status === 402) {
        setScanInfo(`Code lu : ${code}. Identification disponible dès l'activation de l'abonnement KicksDB — cherche le modèle ci-dessous.`)
        return
      }
      if (res.status === 404) {
        setScanInfo(`Code lu : ${code}, mais aucune paire trouvée. Cherche le modèle ci-dessous.`)
        return
      }
      if (!res.ok) {
        setScanInfo(`Code lu : ${code}. Service indisponible, réessaie ou cherche le modèle ci-dessous.`)
        return
      }
      const p = await res.json()
      handleSelect({ sku: p.sku, brand: p.brand, model: p.model, colorway: p.colorway, thumbnail: p.thumbnail })
      if (p.size) setForm(prev => ({ ...prev, size: p.size }))
      setScanInfo(p.size ? `Paire identifiée en ${p.size}.` : 'Paire identifiée — indique la pointure.')
    } catch {
      setScanInfo(`Code lu : ${code}. Identification impossible pour le moment.`)
    }
  }

  function reset() {
    setOpen(false)
    setSelected(null)
    setQuery('')
    setError('')
    setScanInfo('')
    setForm({ size: '', orderNumber: '', platform: 'StockX', buyPrice: '', fees: '' })
  }

  async function handleSubmit() {
    if (!selected || !form.buyPrice || !form.size) {
      setError("Champs obligatoires : sneaker, pointure et prix d'achat.")
      return
    }
    setError('')
    setLoading(true)
    await fetch('/api/purchases', {
      method: 'POST',
      body: JSON.stringify({
        brand: selected.brand,
        model: selected.model,
        colorway: selected.colorway,
        sku: selected.sku,
        thumbnail: selected.thumbnail,
        size: form.size,
        orderNumber: form.orderNumber,
        platform: form.platform,
        buyPrice: parseFloat(form.buyPrice),
        fees: parseFloat(form.fees) || 0,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    setLoading(false)
    reset()
    router.refresh()
  }

  if (!open) {
    return (
      <div className="mb-6">
        <button onClick={() => setOpen(true)} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-bg hover:bg-ink/90 transition">
          + Ajouter un achat
        </button>
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-card border border-line bg-surface p-5 shadow-card md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight text-ink">Nouvel achat</h2>
        <BarcodeScanner onResult={handleScan} />
      </div>
      {scanInfo && <p className="mb-4 rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm text-accent-ink">{scanInfo}</p>}

      <div className="relative mb-4">
        <label htmlFor="sneaker-search" className={`${label} mb-1.5 block`}>Sneaker <span className="text-neg">*</span></label>
        <input id="sneaker-search" value={query} onChange={e => { setQuery(e.target.value); setSelected(null) }} placeholder="Ex : Air Max 1 Lemonade…" autoComplete="off" className={input} />
        {searching && <div className="absolute right-3 top-[34px] text-xs text-muted">Recherche…</div>}
        {results.length > 0 && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-card">
            {results.map(product => (
              <button key={product.sku} type="button" onClick={() => handleSelect(product)} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-bg">
                {product.thumbnail ? (
                  <Image src={product.thumbnail} alt={product.model} width={44} height={44} className="rounded-[10px] bg-[#EFEBE3] object-contain" />
                ) : (
                  <div className="h-11 w-11 rounded-[10px] bg-[#EFEBE3]" />
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">{product.brand} {product.model}</div>
                  <div className="truncate text-xs text-muted">{product.colorway} · {product.sku}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="size" className={label}>Pointure <span className="text-neg">*</span></label>
            <input id="size" name="size" value={form.size} onChange={handleChange} placeholder="EU 41" className={input} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="buyPrice" className={label}>Prix d'achat (€) <span className="text-neg">*</span></label>
            <input id="buyPrice" name="buyPrice" type="number" inputMode="decimal" value={form.buyPrice} onChange={handleChange} placeholder="0.00" className={input} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fees" className={label}>Frais annexes (€)</label>
            <input id="fees" name="fees" type="number" inputMode="decimal" value={form.fees} onChange={handleChange} placeholder="0.00" className={input} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="platform" className={label}>Fournisseur</label>
            <select id="platform" name="platform" value={form.platform} onChange={handleChange} className={input}>
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label htmlFor="orderNumber" className={label}>N° de commande</label>
            <input id="orderNumber" name="orderNumber" value={form.orderNumber} onChange={handleChange} placeholder="03-XXXXXXXX" className={input} />
          </div>
        </div>
      )}

      {error && <p className="mb-3 text-sm text-neg">{error}</p>}

      <div className="flex justify-end gap-2">
        <button onClick={reset} className="px-3 py-2 text-sm text-muted hover:text-ink transition">Annuler</button>
        <button onClick={handleSubmit} disabled={loading || !selected} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-bg hover:bg-ink/90 disabled:opacity-50 transition">
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
