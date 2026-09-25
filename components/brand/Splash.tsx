'use client'

import { useEffect, useState } from 'react'

const SHOE = 'M5 72 C5 63 11 59 20 58 L28 57 C36 55 42 44 50 38 C53 35 57 35 59 38 C61 43 64 46 68 45 C75 43 83 41 88 46 C92 51 93 58 93 66 L93 75 Q93 80 88 80 L10 80 Q5 80 5 75 Z'
const CURVE = 'M40 67 L52 58 L60 64 L84 34'

export default function Splash() {
  const [phase, setPhase] = useState<'hidden' | 'show' | 'fade'>('hidden')

  useEffect(() => {
    if (sessionStorage.getItem('st-splash')) return
    sessionStorage.setItem('st-splash', '1')
    setPhase('show')
    const t1 = setTimeout(() => setPhase('fade'), 2200)
    const t2 = setTimeout(() => setPhase('hidden'), 2700)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (phase === 'hidden') return null
  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-[#1F2021] transition-opacity duration-500 ${phase === 'fade' ? 'opacity-0' : 'opacity-100'}`}
      aria-hidden="true"
    >
      <style>{`
        @keyframes st-shoe { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        @keyframes st-draw { to { stroke-dashoffset: 0 } }
        @keyframes st-pop { 0% { transform: scale(0); opacity: 0 } 70% { transform: scale(1.25); opacity: 1 } 100% { transform: scale(1) } }
        @keyframes st-word { from { opacity: 0 } to { opacity: 1 } }
        .st-shoe { animation: st-shoe .45s ease-out both }
        .st-cut, .st-curve { stroke-dasharray: 100; stroke-dashoffset: 100; animation: st-draw .7s cubic-bezier(.4,0,.2,1) .55s forwards }
        .st-dot { transform-origin: 86px 31.5px; transform: scale(0); opacity: 0; animation: st-pop .35s ease-out 1.2s forwards }
        .st-word { animation: st-word .4s ease-out 1.35s both }
      `}</style>
      <svg width="128" height="128" viewBox="0 0 100 100">
        <g className="st-shoe">
          <path d={SHOE} fill="#FFFFFF" />
          <path d="M5 70 L93 70" stroke="#1F2021" strokeWidth="2.2" />
        </g>
        <path className="st-cut" d={CURVE} pathLength={100} fill="none" stroke="#1F2021" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
        <path className="st-curve" d={CURVE} pathLength={100} fill="none" stroke="#849681" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
        <g className="st-dot">
          <circle cx="86" cy="31.5" r="6" fill="#1F2021" />
          <circle cx="86" cy="31.5" r="4.6" fill="#849681" />
        </g>
      </svg>
      <span className="st-word text-[20px] font-extrabold tracking-tight text-white">SOLE<span className="text-[#849681]">TRACK</span></span>
    </div>
  )
}
