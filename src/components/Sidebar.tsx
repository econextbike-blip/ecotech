'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  FileText,
  Users,
  DollarSign,
  Wrench,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orcamentos', label: 'Orçamentos', icon: FileText },
  { href: '/ordens', label: 'Ordens de Serviço', icon: ClipboardList },
  { href: '/produtos', label: 'Produtos / Peças', icon: Package },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign },
]

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-brand-blue/20 text-brand-blue'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

function LogoutButton() {
  const { logout } = useAuth()
  return (
    <button
      onClick={logout}
      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-red-400 transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Sair
    </button>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile menu on route change
  const pathname = usePathname()
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const sidebarContent = (onNavigate?: () => void) => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-brand-green" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">E-Tech</h1>
            <p className="text-[11px] text-gray-400">Bike Elétrica</p>
          </div>
        </div>
        {/* Close button - mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-gray-400"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <Suspense fallback={
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>
      }>
        <SidebarNav onNavigate={onNavigate} />
      </Suspense>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <LogoutButton />
        <p className="text-[10px] text-gray-500 mt-2 px-2">E-Tech Bike Elétrica</p>
        <p className="text-[10px] text-gray-600 px-2">Sistema de Gestão v1.0</p>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-brand-dark flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-300"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-brand-green" />
          </div>
          <span className="font-bold text-white text-sm">E-Tech</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-brand-dark text-white flex flex-col animate-slide-in">
            {sidebarContent(() => setMobileOpen(false))}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 bg-brand-dark text-white flex-col">
        {sidebarContent()}
      </aside>
    </>
  )
}
