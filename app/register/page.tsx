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

  const input =
    'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent-soft transition'
  const label = 'text-[11px] font-medium uppercase tracking-wider text-muted'

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-2xl font-bold tracking-tight text-ink">
            SOLE<span className="text-muted">TRACK</span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
            Achat · Stock · Revente
          </p>
        </div>

        <div className="bg-surface border border-line rounded-card shadow-card p-6">
          <h1 className="text-lg font-semibold text-ink mb-6">Créer un compte</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className={label}>Nom d'utilisateur *</label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))}
                className={input}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className={label}>Email *</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                className={input}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className={label}>Mot de passe *</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                  className={`${input} pr-20`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted hover:text-ink transition"
                >
                  {showPassword ? 'Masquer' : 'Afficher'}
                </button>
              </div>
            </div>

            <label
              htmlFor="alerts"
              className="flex items-start gap-3 rounded-xl border border-line bg-bg px-3.5 py-3 cursor-pointer"
            >
              <input
                type="checkbox"
                id="alerts"
                checked={form.alertsEnabled}
                onChange={e => setForm(prev => ({ ...prev, alertsEnabled: e.target.checked }))}
                className="mt-0.5 h-4 w-4 accent-[var(--st-accent)]"
              />
              <span className="text-sm text-ink">
                Recevoir les alertes de revente par email lors des mises à jour quotidiennes
              </span>
            </label>

            {error && <p className="text-sm text-neg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-bg hover:bg-ink/90 disabled:opacity-50 transition"
            >
              {loading ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            Déjà un compte ?{' '}
            <Link href="/login" className="font-medium text-accent-ink hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
