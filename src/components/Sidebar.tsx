'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  DollarSign,
  Wrench,
} from 'lucide-react'

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ordens', label: 'Ordens de Serviço', icon: ClipboardList },
  { href: '/produtos', label: 'Produtos / Peças', icon: Package },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign },
]

function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
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

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-brand-dark text-white flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center">
          <Wrench className="w-5 h-5 text-brand-green" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">Eco Tech</h1>
          <p className="text-[11px] text-gray-400">Bike Elétrica</p>
        </div>
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
        <SidebarNav />
      </Suspense>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-[10px] text-gray-500">E-Tech Bike Elétrica</p>
        <p className="text-[10px] text-gray-600">Sistema de Gestão v1.0</p>
      </div>
    </aside>
  )
}
