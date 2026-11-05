'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  login: (user: string, pass: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: () => false,
  logout: () => {},
})

const CREDENTIALS = { user: 'admin', pass: 'admin26' }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('etech_auth')
      if (saved === 'true') setIsAuthenticated(true)
    } catch {}
    setLoading(false)
  }, [])

  function login(user: string, pass: string): boolean {
    if (user === CREDENTIALS.user && pass === CREDENTIALS.pass) {
      setIsAuthenticated(true)
      try { localStorage.setItem('etech_auth', 'true') } catch {}
      return true
    }
    return false
  }

  function logout() {
    setIsAuthenticated(false)
    try { localStorage.removeItem('etech_auth') } catch {}
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
