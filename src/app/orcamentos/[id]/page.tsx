'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Quote, QuoteItem, Client } from '@/lib/supabase'
import { formatCurrency, formatDate, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '@/lib/format'
import { ArrowLeft, ClipboardList, Edit2, Trash2, Clock, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import Modal from '@/components/Modal'

function QuoteStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${QUOTE_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'}`}>
      {QUOTE_STATUS_LABELS[status] || status}
    </span>
  )
}

function OrcamentoDetalheContent() {
  const params = useParams()
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [items, setItems] = useState<QuoteItem[]>([])
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusModal, setStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [deletingQuote, setDeletingQuote] = useState(false)
  const [converting, setConverting] = useState(false)

  async function load() {
    const { data: q } = await supabase.from('quotes').select('*').eq('id', params.id).single()
    if (!q) { router.push('/orcamentos'); return }
    setQuote(q as Quote)
    setNewStatus(q.status)

    const { data: itms } = await supabase.from('quote_items').select('*').eq('quote_id', q.id).order('created_at')
    setItems((itms || []) as QuoteItem[])

    if (q.client_id) {
      const { data: c } = await supabase.from('clients').select('*').eq('id', q.client_id).single()
      if (c) setClient(c as Client)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [params.id])

  async function updateStatus() {
    if (!quote) return
    await supabase.from('quotes').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', quote.id)
    setStatusModal(false)
    load()
  }

  async function handleDeleteQuote() {
    if (!quote) return
    if (!confirm(`Excluir Orçamento #${String(quote.quote_number).padStart(4, '0')}?\n\nTodos os itens relacionados serão excluídos.\n\nEssa ação não pode ser desfeita.`)) return
    setDeletingQuote(true)
    const { error } = await supabase.from('quotes').delete().eq('id', quote.id)
    if (error) {
      alert('Erro ao excluir: ' + error.message)
      setDeletingQuote(false)
    } else {
      router.push('/orcamentos')
    }
  }

  async function convertToOS() {
    if (!quote) return
    if (!confirm(`Converter Orçamento #${String(quote.quote_number).padStart(4, '0')} em Ordem de Serviço?\n\nUma nova OS será criada com os mesmos dados e itens.`)) return
    setConverting(true)

    try {
      // Create the service order
      const { data: order, error: orderError } = await supabase.from('service_orders').insert({
        client_id: quote.client_id || null,
        equipment: quote.equipment,
        brand: quote.brand || null,
        model: quote.model || null,
        serial_number: quote.serial_number || null,
        color: quote.color || null,
        symptom_report: quote.reported_issue || null,
        technical_diagnosis: quote.proposed_solution || null,
        total: quote.total,
        status: 'pendente',
      }).select('id, order_number').single()

      if (orderError || !order) {
        alert('Erro ao criar OS: ' + (orderError?.message || 'desconhecido'))
        setConverting(false)
        return
      }

      // Copy items to order_items
      if (items.length > 0) {
        const orderItems = items.map(it => ({
          order_id: order.id,
          product_id: it.product_id || null,
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unit_price,
          total: it.total,
          item_type: it.item_type,
        }))
        await supabase.from('order_items').insert(orderItems)
      }

      // Update quote as approved and linked
      await supabase.from('quotes').update({
        status: 'aprovado',
        converted_order_id: order.id,
        updated_at: new Date().toISOString(),
      }).eq('id', quote.id)

      alert(`OS #${String(order.order_number).padStart(4, '0')} criada com sucesso!`)
      router.push(`/ordens/${order.id}`)
    } catch {
      alert('Erro inesperado. Tente novamente.')
      setConverting(false)
    }
  }

  function getExpiryDate(): string {
    if (!quote) return ''
    const created = new Date(quote.created_at)
    const expiry = new Date(created.getTime() + quote.validity_days * 24 * 60 * 60 * 1000)
    return expiry.toLocaleDateString('pt-BR')
  }

  function isExpired(): boolean {
    if (!quote) return false
    const created = new Date(quote.created_at)
    const expiry = new Date(created.getTime() + quote.validity_days * 24 * 60 * 60 * 1000)
    return new Date() > expiry
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green" /></div>
  }

  if (!quote) return null

  const effectiveStatus = quote.status === 'pendente' && isExpired() ? 'expirado' : quote.status

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/orcamentos" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Orçamento #{String(quote.quote_number).padStart(4, '0')}
            </h1>
            <p className="text-sm text-gray-500">{formatDate(quote.created_at)}</p>
          </div>
          <QuoteStatusBadge status={effectiveStatus} />
        </div>
        <div className="flex flex-wrap gap-2 ml-11 sm:ml-0">
          {quote.status === 'pendente' && !isExpired() && !quote.converted_order_id && (
            <button onClick={convertToOS} disabled={converting} className="flex items-center gap-1.5 px-3 py-2 bg-brand-green text-brand-dark rounded-lg text-xs sm:text-sm font-medium hover:bg-brand-green/90 transition-colors disabled:opacity-50">
              <ClipboardList className="w-4 h-4" /> {converting ? 'Convertendo...' : <><span className="hidden sm:inline">Converter em </span>OS</>}
            </button>
          )}
          <button onClick={() => setStatusModal(true)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm hover:bg-gray-50 transition-colors">
            <Edit2 className="w-4 h-4" /> Status
          </button>
          <button onClick={handleDeleteQuote} disabled={deletingQuote} className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 rounded-lg text-xs sm:text-sm hover:bg-red-50 transition-colors disabled:opacity-50">
            <Trash2 className="w-4 h-4" /> Excluir
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Converted notice */}
        {quote.converted_order_id && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Orçamento aprovado e convertido em OS</p>
              <Link href={`/ordens/${quote.converted_order_id}`} className="text-sm text-green-600 underline hover:text-green-700">
                Ver Ordem de Serviço →
              </Link>
            </div>
          </div>
        )}

        {/* Expired notice */}
        {effectiveStatus === 'expirado' && !quote.converted_order_id && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-500 shrink-0" />
            <p className="text-sm text-gray-600">Este orçamento expirou em {getExpiryDate()}</p>
          </div>
        )}

        {/* Rejected notice */}
        {quote.status === 'rejeitado' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">Este orçamento foi rejeitado pelo cliente</p>
          </div>
        )}

        {/* Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cliente</h3>
              <p className="text-sm font-medium text-gray-900">{client?.name || 'Não informado'}</p>
              {client?.phone && <p className="text-xs text-gray-500">{client.phone}</p>}
              {client?.cpf_cnpj && <p className="text-xs text-gray-500">CPF/CNPJ: {client.cpf_cnpj}</p>}
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Equipamento</h3>
              <p className="text-sm font-medium text-gray-900">{quote.equipment}</p>
              <p className="text-xs text-gray-500">
                {[quote.brand, quote.model, quote.color].filter(Boolean).join(' · ')}
                {quote.serial_number && ` · S/N: ${quote.serial_number}`}
              </p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Validade</h3>
              <p className="text-sm text-gray-700">{quote.validity_days} dias — até {getExpiryDate()}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total</h3>
              <p className="text-lg font-bold text-brand-green">{formatCurrency(quote.total)}</p>
            </div>
          </div>
        </div>

        {/* Problema */}
        {quote.reported_issue && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Defeito Declarado / Problema</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.reported_issue}</p>
          </div>
        )}

        {/* Solução */}
        {quote.proposed_solution && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Solução Proposta</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.proposed_solution}</p>
          </div>
        )}

        {/* Itens */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Produtos e Serviços</h3>
          {items.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum item registrado.</p>
          ) : (
            <>
              {/* Desktop table */}
              <table className="w-full hidden sm:table">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-400 uppercase">
                    <th className="pb-2">#</th>
                    <th className="pb-2">Tipo</th>
                    <th className="pb-2">Descrição</th>
                    <th className="pb-2 text-center">Qtd</th>
                    <th className="pb-2 text-right">Unit.</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((it, i) => (
                    <tr key={it.id}>
                      <td className="py-2 text-sm text-gray-400">{String(i + 1).padStart(2, '0')}</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          it.item_type === 'servico' ? 'bg-blue-50 text-blue-700' :
                          it.item_type === 'peca' ? 'bg-amber-50 text-amber-700' :
                          'bg-purple-50 text-purple-700'
                        }`}>
                          {it.item_type === 'servico' ? 'Serviço' : it.item_type === 'peca' ? 'Peça' : 'Produto'}
                        </span>
                      </td>
                      <td className="py-2 text-sm text-gray-900">{it.description}</td>
                      <td className="py-2 text-sm text-gray-600 text-center">{it.quantity}</td>
                      <td className="py-2 text-sm text-gray-600 text-right">{formatCurrency(it.unit_price)}</td>
                      <td className="py-2 text-sm font-medium text-gray-900 text-right">{formatCurrency(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200">
                    <td colSpan={5} className="py-3 text-right text-sm font-bold text-gray-700">TOTAL</td>
                    <td className="py-3 text-right text-lg font-bold text-brand-green">{formatCurrency(quote.total)}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Mobile cards */}
              <div className="sm:hidden space-y-2">
                {items.map((it, i) => (
                  <div key={it.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">#{i + 1}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          it.item_type === 'servico' ? 'bg-blue-50 text-blue-700' :
                          it.item_type === 'peca' ? 'bg-amber-50 text-amber-700' :
                          'bg-purple-50 text-purple-700'
                        }`}>
                          {it.item_type === 'servico' ? 'Serviço' : it.item_type === 'peca' ? 'Peça' : 'Produto'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(it.total)}</span>
                    </div>
                    <p className="text-sm text-gray-900">{it.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{it.quantity}x {formatCurrency(it.unit_price)}</p>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
                  <span className="text-sm font-bold text-gray-700">TOTAL</span>
                  <span className="text-lg font-bold text-brand-green">{formatCurrency(quote.total)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Observações */}
        {quote.notes && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Observações</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}
      </div>

      {/* Status Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Alterar Status do Orçamento">
        <div className="space-y-4">
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green">
            {Object.entries(QUOTE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div className="flex justify-end gap-3">
            <button onClick={() => setStatusModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
            <button onClick={updateStatus} className="px-5 py-2 bg-brand-green text-brand-dark rounded-lg text-sm font-medium hover:bg-brand-green/90">Salvar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default function OrcamentoDetalhePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green" /></div>}>
      <OrcamentoDetalheContent />
    </Suspense>
  )
}
