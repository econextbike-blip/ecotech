'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Wrench, LogIn } from 'lucide-react'

export default function LoginScreen() {
  const { login } = useAuth()
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(false)
    setLoading(true)

    setTimeout(() => {
      const ok = login(user.trim(), pass)
      if (!ok) {
        setError(true)
        setLoading(false)
      }
    }, 400)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-green/10 mb-4">
            <Wrench className="w-8 h-8 text-brand-green" />
          </div>
          <h1 className="text-3xl font-bold text-white">E-Tech</h1>
          <p className="text-sm text-gray-400 mt-1">Bike Elétrica — Sistema de Gestão</p>
        </div>

        {/* Login card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Usuário</label>
              <input
                type="text"
                value={user}
                onChange={e => { setUser(e.target.value); setError(false) }}
                placeholder="Digite seu usuário"
                autoFocus
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue/40 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Senha</label>
              <input
                type="password"
                value={pass}
                onChange={e => { setPass(e.target.value); setError(false) }}
                placeholder="Digite sua senha"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue/40 transition-colors"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg py-2">
                Usuário ou senha incorretos
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !user.trim() || !pass}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-blue text-white rounded-xl text-sm font-semibold hover:bg-brand-blue/90 disabled:opacity-40 transition-all"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-gray-600 mt-6">
          E-Tech Bike Elétrica — O Futuro Se Move Aqui.
        </p>
      </div>
    </div>
  )
}
