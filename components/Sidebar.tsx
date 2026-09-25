import LogoutButton from './LogoutButton'
import SoleTrackMark from './brand/SoleTrackMark'

const NAV = [
  { href: '#dashboard', label: 'Dashboard', d: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z', active: true },
  { href: '#stock', label: 'Stock', d: 'M3 7h18v13H3zM3 7l3-3h12l3 3' },
  { href: '#achats', label: 'Achats', d: 'M6 6h15l-1.5 9h-12zM6 6L5 3H2M9 20h.01M18 20h.01' },
  { href: '#ventes', label: 'Ventes', d: 'M12 21V3M7 8l5-5 5 5' },
  { href: '#statistiques', label: 'Statistiques', d: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
  { href: '#plateformes', label: 'Plateformes', d: 'M12 9a3 3 0 100 6 3 3 0 000-6zM12 3v3M12 18v3M3 12h3M18 12h3' },
  { href: '#export', label: 'Export', d: 'M12 15V3M8 7l4-4 4 4M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4' },
]

const BASE = 'flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13.5px] font-medium transition-colors'
const ON = 'bg-white/[0.08] text-white'
const OFF = 'text-[#B4B0A8] hover:bg-white/[0.05] hover:text-white'

export default function Sidebar({ username }: { username: string }) {
  const initials = username.slice(0, 2).toUpperCase()

  return (
    <aside className="bg-side text-[#E7E5E1] md:sticky md:top-0 md:h-screen flex md:flex-col flex-row flex-wrap items-center md:items-stretch gap-1 px-4 py-3 md:py-5">
      <a href="#dashboard" className="flex w-auto md:w-full items-center gap-2.5 px-2 pb-0 md:pb-5" aria-label="SoleTrack">
        <SoleTrackMark size={30} />
        <span className="font-extrabold text-[17px] tracking-tight leading-none">SOLE<span className="text-[#849681]">TRACK</span></span>
      </a>

      <nav className="flex md:flex-col flex-row flex-wrap gap-1 md:gap-0.5">
        {NAV.map(item => (
          <a key={item.href} href={item.href} className={`${BASE} ${item.active ? ON : OFF}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={item.d} /></svg>
            <span className="hidden md:inline">{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="ml-auto md:ml-0 md:mt-auto flex items-center gap-2.5 md:border-t md:border-white/[0.08] md:pt-3 px-2 text-[13px] text-[#C9C5BD]">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-[#0f120e]">{initials}</span>
        <span className="hidden md:inline truncate max-w-[90px]">{username}</span>
        <span className="md:ml-auto"><LogoutButton /></span>
      </div>
    </aside>
  )
}
