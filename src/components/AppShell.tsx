'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoginScreen from './LoginScreen'
import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <>
      <Sidebar />
      <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </>
  )
}
