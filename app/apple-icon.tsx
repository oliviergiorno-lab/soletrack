import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, background: '#1F2021', display: 'flex' }}>
        <svg width="180" height="180" viewBox="0 0 100 100">
          <path d="M6 73 C6 64 12 61 20 60 L34 58 C44 56 50 47 60 41 C64 39 67 42 71 43 C76 44 78 40 82 40 C88 40 92 48 92 58 L92 75 Q92 80 87 80 L11 80 Q6 80 6 75 Z" fill="#FFFFFF" />
          <path d="M6 70 L92 70" stroke="#1F2021" strokeWidth="2.2" />
          <path d="M20 66 L36 58 L46 64 L80 30" fill="none" stroke="#1F2021" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 66 L36 58 L46 64 L80 30" fill="none" stroke="#849681" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="82.5" cy="27" r="6" fill="#1F2021" />
          <circle cx="82.5" cy="27" r="4.6" fill="#849681" />
        </svg>
      </div>
    ),
    size
  )
}
