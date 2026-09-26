'use client'

import { useEffect, useState } from 'react'

const NAV = [
  { href: '#dashboard', label: 'Dashboard', d: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z' },
  { href: '#stock', label: 'Stock', d: 'M3 7h18v13H3zM3 7l3-3h12l3 3' },
  { href: '#achats', label: 'Achats', d: 'M6 6h15l-1.5 9h-12zM6 6L5 3H2M9 20h.01M18 20h.01' },
  { href: '#ventes', label: 'Ventes', d: 'M12 21V3M7 8l5-5 5 5' },
  { href: '#statistiques', label: 'Statistiques', d: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
  { href: '#plateformes', label: 'Plateformes', d: 'M12 9a3 3 0 100 6 3 3 0 000-6zM12 3v3M12 18v3M3 12h3M18 12h3' },
  { href: '#export', label: 'Export', d: 'M12 15V3M8 7l4-4 4 4M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4' },
]

const BASE = 'flex shrink-0 items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13.5px] font-medium transition-colors'
const ON = 'bg-white/[0.08] text-white'
const OFF = 'text-[#B4B0A8] hover:bg-white/[0.05] hover:text-white'

export default function NavLinks() {
  const [active, setActive] = useState('#dashboard')

  useEffect(() => {
    const apply = () => setActive(window.location.hash || '#dashboard')
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [])

  return (
    <nav className="-mx-1 flex flex-row gap-1 overflow-x-auto px-1 md:mx-0 md:flex-col md:gap-0.5 md:overflow-visible md:px-0">
      {NAV.map(item => (
        <a key={item.href} href={item.href} className={`${BASE} ${active === item.href ? ON : OFF}`} aria-label={item.label}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={item.d} /></svg>
          <span className="hidden md:inline">{item.label}</span>
        </a>
      ))}
    </nav>
  )
}
