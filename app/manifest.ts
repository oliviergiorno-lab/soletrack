import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SoleTrack',
    short_name: 'SoleTrack',
    display: 'standalone',
    background_color: '#F7F5F0',
    theme_color: '#1F2021',
    start_url: '/',
    icons: [{ src: '/brand/soletrack-mark-dark.svg', sizes: 'any', type: 'image/svg+xml' }],
  }
}
