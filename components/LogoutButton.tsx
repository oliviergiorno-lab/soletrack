'use client'

import { signOut } from 'next-auth/react'

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-zinc-500 hover:text-white text-xs transition-colors"
    >
      Déconnexion
    </button>
  )
}
