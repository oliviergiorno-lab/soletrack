type Props = {
  size?: number
  className?: string
  /** 'dark' = sneaker blanche (fond sombre), 'light' = sneaker charbon (fond clair) */
  tone?: 'dark' | 'light'
}

const SHOE = 'M5 72 C5 63 11 59 20 58 L28 57 C36 55 42 44 50 38 C53 35 57 35 59 38 C61 43 64 46 68 45 C75 43 83 41 88 46 C92 51 93 58 93 66 L93 75 Q93 80 88 80 L10 80 Q5 80 5 75 Z'
const CURVE = 'M40 67 L52 58 L60 64 L84 34'

export default function SoleTrackMark({ size = 28, className = '', tone = 'dark' }: Props) {
  const shoe = tone === 'dark' ? '#FFFFFF' : '#1F2021'
  const cut = tone === 'dark' ? '#1C1C1E' : '#F7F5F0'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d={SHOE} fill={shoe} />
      <path d="M5 70 L93 70" stroke={cut} strokeWidth="2.2" />
      <path d={CURVE} fill="none" stroke={cut} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={CURVE} fill="none" stroke="#849681" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="86" cy="31.5" r="6" fill={cut} />
      <circle cx="86" cy="31.5" r="4.6" fill="#849681" />
    </svg>
  )
}
