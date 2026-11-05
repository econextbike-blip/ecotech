'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/format'
import { Plus, Search, ClipboardList, Trash2 } from 'lucide-react'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'

interface OrderRow {
  id: string
  order_number: number
  equipment: string
  status: string
  total: number
  created_at: string
  clients: { name: string } | null
}

export default function OrdensPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    let query = supabase.from('service_orders').select('id, order_number, equipment, status, total, created_at, clients(name)').order('created_at', { ascending: false })
    if (statusFilter) query = query.eq('status', statusFilter)
    if (search) query = query.ilike('equipment', `%${search}%`)
    const { data } = await query
    setOrders((data || []) as unknown as OrderRow[])
    setLoading(false)
  }

  async function handleDelete(e: React.MouseEvent, order: OrderRow) {
    e.stopPropagation()
    if (!confirm(`Excluir OS #${String(order.order_number).padStart(4, '0')} — ${order.equipment}?\n\nEssa ação não pode ser desfeita.`)) return
    setDeleting(order.id)
    const { error } = await supabase.from('service_orders').delete().eq('id', order.id)
    if (error) {
      alert('Erro ao excluir: ' + error.message)
    } else {
      setOrders(orders.filter(o => o.id !== order.id))
    }
    setDeleting(null)
  }

  useEffect(() => { load() }, [search, statusFilter])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Ordens de Serviço</h1>
          <p className="text-sm text-gray-500 mt-1">{orders.length} ordens</p>
        </div>
        <Link href="/ordens/nova" className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-brand-blue/90 transition-colors">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nova OS</span><span className="sm:hidden">Nova</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar equipamento..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue">
            <option value="">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluida">Concluída</option>
            <option value="entregue">Entregue</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-blue" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Nenhuma ordem de serviço encontrada.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full hidden md:table">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Nº OS</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Equipamento</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => window.location.href = `/ordens/${o.id}`}>
                    <td className="px-5 py-3 text-sm font-bold text-brand-blue">#{String(o.order_number).padStart(4, '0')}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{o.clients?.name || '—'}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{o.equipment}</td>
                    <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(o.total)}</td>
                    <td className="px-5 py-3 text-sm text-gray-400">{formatDate(o.created_at)}</td>
                    <td className="px-3 py-3">
                      <button onClick={e => handleDelete(e, o)} disabled={deleting === o.id} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {orders.map(o => (
                <div key={o.id} className="p-4 hover:bg-gray-50/50 transition-colors" onClick={() => window.location.href = `/ordens/${o.id}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-sm font-bold text-brand-blue">#{String(o.order_number).padStart(4, '0')}</span>
                      <span className="text-xs text-gray-400 ml-2">{formatDate(o.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={o.status} />
                      <button onClick={e => handleDelete(e, o)} disabled={deleting === o.id} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors" title="Excluir">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{o.equipment}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">{o.clients?.name || 'Sem cliente'}</p>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(o.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
