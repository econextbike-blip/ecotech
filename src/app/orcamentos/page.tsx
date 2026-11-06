'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '@/lib/format'
import { Plus, Search, FileText, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface QuoteRow {
  id: string
  quote_number: number
  equipment: string
  status: string
  total: number
  validity_days: number
  created_at: string
  clients: { name: string } | null
}

function QuoteStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${QUOTE_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'}`}>
      {QUOTE_STATUS_LABELS[status] || status}
    </span>
  )
}

function isExpired(createdAt: string, validityDays: number): boolean {
  const created = new Date(createdAt)
  const expiry = new Date(created.getTime() + validityDays * 24 * 60 * 60 * 1000)
  return new Date() > expiry
}

function formatValidity(createdAt: string, validityDays: number): string {
  const created = new Date(createdAt)
  const expiry = new Date(created.getTime() + validityDays * 24 * 60 * 60 * 1000)
  return expiry.toLocaleDateString('pt-BR')
}

export default function OrcamentosPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    let query = supabase.from('quotes').select('id, quote_number, equipment, status, total, validity_days, created_at, clients(name)').order('created_at', { ascending: false })
    if (statusFilter) query = query.eq('status', statusFilter)
    if (search) query = query.ilike('equipment', `%${search}%`)
    const { data } = await query
    setQuotes((data || []) as unknown as QuoteRow[])
    setLoading(false)
  }

  async function handleDelete(e: React.MouseEvent, quote: QuoteRow) {
    e.stopPropagation()
    if (!confirm(`Excluir Orçamento #${String(quote.quote_number).padStart(4, '0')} — ${quote.equipment}?\n\nEssa ação não pode ser desfeita.`)) return
    setDeleting(quote.id)
    const { error } = await supabase.from('quotes').delete().eq('id', quote.id)
    if (error) {
      alert('Erro ao excluir: ' + error.message)
    } else {
      setQuotes(quotes.filter(q => q.id !== quote.id))
    }
    setDeleting(null)
  }

  useEffect(() => { load() }, [search, statusFilter])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-sm text-gray-500 mt-1">{quotes.length} orçamentos</p>
        </div>
        <Link href="/orcamentos/novo" className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-brand-green text-brand-dark rounded-lg text-sm font-medium hover:bg-brand-green/90 transition-colors">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo Orçamento</span><span className="sm:hidden">Novo</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar equipamento..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green">
            <option value="">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="aprovado">Aprovado</option>
            <option value="rejeitado">Rejeitado</option>
            <option value="expirado">Expirado</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-green" /></div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Nenhum orçamento encontrado.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full hidden md:table">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Nº</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Equipamento</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Validade</th>
                  <th className="px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {quotes.map(q => (
                  <tr key={q.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => window.location.href = `/orcamentos/${q.id}`}>
                    <td className="px-5 py-3 text-sm font-bold text-brand-green">#{String(q.quote_number).padStart(4, '0')}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{q.clients?.name || '—'}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{q.equipment}</td>
                    <td className="px-5 py-3">
                      {q.status === 'pendente' && isExpired(q.created_at, q.validity_days)
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Expirado</span>
                        : <QuoteStatusBadge status={q.status} />
                      }
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(q.total)}</td>
                    <td className="px-5 py-3 text-sm text-gray-400">{formatValidity(q.created_at, q.validity_days)}</td>
                    <td className="px-3 py-3">
                      <button onClick={e => handleDelete(e, q)} disabled={deleting === q.id} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {quotes.map(q => (
                <div key={q.id} className="p-4 hover:bg-gray-50/50 transition-colors" onClick={() => window.location.href = `/orcamentos/${q.id}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-sm font-bold text-brand-green">#{String(q.quote_number).padStart(4, '0')}</span>
                      <span className="text-xs text-gray-400 ml-2">até {formatValidity(q.created_at, q.validity_days)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {q.status === 'pendente' && isExpired(q.created_at, q.validity_days)
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Expirado</span>
                        : <QuoteStatusBadge status={q.status} />
                      }
                      <button onClick={e => handleDelete(e, q)} disabled={deleting === q.id} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors" title="Excluir">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{q.equipment}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">{q.clients?.name || 'Sem cliente'}</p>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(q.total)}</p>
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
