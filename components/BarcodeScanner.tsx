'use client'

import { useRef, useState } from 'react'

type Props = {
  onResult: (code: string) => void
}

export default function BarcodeScanner({ onResult }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const { readBarcodes } = await import('zxing-wasm/reader')
      const results = await readBarcodes(file, {
        formats: ['EAN-13', 'UPC-A', 'UPC-E', 'EAN-8'],
        tryHarder: true,
        maxNumberOfSymbols: 1,
      })
      const text = results.find(r => r.isValid && r.text)?.text
      if (text) onResult(text.trim())
      else setError('Aucun code lisible. Rapproche-toi du code-barres et évite les reflets.')
    } catch {
      setError('Lecture impossible sur cette photo. Réessaie.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" aria-hidden="true" tabIndex={-1} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink hover:bg-bg disabled:opacity-50 transition">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3M7 12h10" /></svg>
        {busy ? 'Lecture…' : 'Scanner la boîte'}
      </button>
      {error && <span className="text-xs text-neg">{error}</span>}
    </div>
  )
}
