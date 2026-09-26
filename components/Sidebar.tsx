import LogoutButton from './LogoutButton'
import SoleTrackMark from './brand/SoleTrackMark'
import NavLinks from './NavLinks'

export default function Sidebar({ username }: { username: string }) {
  const initials = username.slice(0, 2).toUpperCase()

  return (
    <aside className="flex flex-col gap-2 bg-side px-4 pb-2 pt-[calc(env(safe-area-inset-top)+10px)] text-[#E7E5E1] md:sticky md:top-0 md:h-screen md:gap-1 md:py-5">
      <div className="flex items-center justify-between md:block">
        <a href="#dashboard" className="flex items-center gap-2.5 px-2 md:pb-5" aria-label="SoleTrack">
          <SoleTrackMark size={30} />
          <span className="font-extrabold text-[17px] tracking-tight leading-none">SOLE<span className="text-[#849681]">TRACK</span></span>
        </a>
        <div className="flex items-center gap-2 text-[13px] text-[#C9C5BD] md:hidden">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-[#0f120e]">{initials}</span>
          <LogoutButton />
        </div>
      </div>

      <NavLinks />

      <div className="mt-auto hidden items-center gap-2.5 border-t border-white/[0.08] px-2 pt-3 text-[13px] text-[#C9C5BD] md:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-[#0f120e]">{initials}</span>
        <span className="truncate max-w-[90px]">{username}</span>
        <span className="ml-auto"><LogoutButton /></span>
      </div>
    </aside>
  )
}
