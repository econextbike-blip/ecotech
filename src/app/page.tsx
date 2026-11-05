'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/format'
import {
  ClipboardList,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'

interface DashboardData {
  totalClients: number
  totalProducts: number
  openOrders: number
  monthRevenue: number
  monthExpenses: number
  recentOrders: Array<{
    id: string
    order_number: number
    equipment: string
    status: string
    total: number
    created_at: string
    clients?: { name: string }
  }>
  lowStockProducts: Array<{
    id: string
    name: string
    stock: number
    min_stock: number
  }>
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      const [clients, products, orders, revenue, expenses, recent] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', true),
        supabase.from('service_orders').select('id', { count: 'exact', head: true }).in('status', ['pendente', 'em_andamento']),
        supabase.from('payments').select('amount').eq('type', 'receita').eq('status', 'confirmado').gte('payment_date', startOfMonth).lte('payment_date', endOfMonth),
        supabase.from('expenses').select('amount').gte('expense_date', startOfMonth).lte('expense_date', endOfMonth),
        supabase.from('service_orders').select('id, order_number, equipment, status, total, created_at, clients(name)').order('created_at', { ascending: false }).limit(5),
      ])

      const { data: allProducts } = await supabase.from('products').select('id, name, stock, min_stock').eq('active', true)
      const lowStockItems = (allProducts || []).filter(p => p.stock <= p.min_stock)

      setData({
        totalClients: clients.count || 0,
        totalProducts: products.count || 0,
        openOrders: orders.count || 0,
        monthRevenue: (revenue.data || []).reduce((sum, p) => sum + Number(p.amount), 0),
        monthExpenses: (expenses.data || []).reduce((sum, e) => sum + Number(e.amount), 0),
        recentOrders: (recent.data || []) as unknown as DashboardData['recentOrders'],
        lowStockProducts: lowStockItems,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
      </div>
    )
  }

  if (!data) return null

  const cards = [
    { label: 'Clientes', value: data.totalClients, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Produtos Ativos', value: data.totalProducts, icon: Package, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'OS Abertas', value: data.openOrders, icon: ClipboardList, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Receita do Mês', value: formatCurrency(data.monthRevenue), icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Resumo do Mês</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Receitas</span>
              </div>
              <span className="text-sm font-bold text-green-600">{formatCurrency(data.monthRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-600">Despesas</span>
              </div>
              <span className="text-sm font-bold text-red-600">{formatCurrency(data.monthExpenses)}</span>
            </div>
            <hr className="border-gray-100" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Saldo</span>
              <span className={`text-lg font-bold ${data.monthRevenue - data.monthExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.monthRevenue - data.monthExpenses)}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Ordens Recentes</h2>
            <Link href="/ordens" className="text-sm text-brand-blue hover:underline">Ver todas</Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nenhuma ordem de serviço ainda.</p>
          ) : (
            <div className="space-y-3">
              {data.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/ordens/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-dark/5 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-brand-dark/40" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        OS #{String(order.order_number).padStart(4, '0')} — {order.equipment}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(order.clients as unknown as { name: string })?.name || 'Sem cliente'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={order.status} />
                    <p className="text-xs text-gray-500 mt-1">{formatCurrency(order.total)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.lowStockProducts.length > 0 && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-amber-800 mb-2">⚠️ Estoque Baixo</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data.lowStockProducts.map((p) => (
              <div key={p.id} className="bg-white rounded-lg p-3 border border-amber-100">
                <p className="text-sm font-medium text-gray-700 truncate">{p.name}</p>
                <p className="text-xs text-amber-600">Estoque: {p.stock} / Mín: {p.min_stock}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
