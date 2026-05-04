'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    alertsEnabled: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(form),
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await res.json()

    if (!res.ok) {
      setLoading(false)
      setError(data.error || 'Une erreur est survenue')
      return
    }

  const signInRes = await signIn('credentials', {
  email: form.email,
  password: form.password,
  redirect: false,
})

    setLoading(false)

    if (signInRes?.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError('Compte créé mais erreur de connexion, veuillez vous connecter manuellement.')
      router.push('/login')
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-8 tracking-tight text-white text-center">
          SOLE<span className="text-green-400">TRACK</span>
        </h1>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Créer un compte</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400 uppercase tracking-wider">Nom d'utilisateur *</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400 uppercase tracking-wider">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-400 uppercase tracking-wider">Mot de passe *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-zinc-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-zinc-400 hover:text-white text-xs"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3">
              <input
                type="checkbox"
                id="alerts"
                checked={form.alertsEnabled}
                onChange={e => setForm(prev => ({ ...prev, alertsEnabled: e.target.checked }))}
                className="w-4 h-4 accent-green-500"
              />
              <label htmlFor="alerts" className="text-sm text-zinc-300 cursor-pointer">
                Recevoir les alertes de revente par email lors des mises à jour quotidiennes
              </label>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold px-5 py-2 rounded-lg text-sm transition-colors mt-2"
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>
          <p className="text-zinc-500 text-sm text-center mt-4">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-green-400 hover:text-green-300">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
