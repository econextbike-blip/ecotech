'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, ServiceOrder, OrderItem, Client, OrderImage } from '@/lib/supabase'
import { formatCurrency, formatDate, STATUS_LABELS, PAYMENT_LABELS } from '@/lib/format'
import { generateLaudoPDF } from '@/lib/pdf-generator'
import { ArrowLeft, FileText, DollarSign, Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import Modal from '@/components/Modal'
import ImageUpload from '@/components/ImageUpload'

function OrdemDetalheContent() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<ServiceOrder | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [client, setClient] = useState<Client | null>(null)
  const [images, setImages] = useState<OrderImage[]>([])
  const [loading, setLoading] = useState(true)
  const [payModal, setPayModal] = useState(false)
  const [statusModal, setStatusModal] = useState(false)
  const [payForm, setPayForm] = useState({ amount: 0, payment_method: 'pix', description: '' })
  const [newStatus, setNewStatus] = useState('')
  const [deletingOrder, setDeletingOrder] = useState(false)

  async function load() {
    const { data: o } = await supabase.from('service_orders').select('*').eq('id', params.id).single()
    if (!o) { router.push('/ordens'); return }
    setOrder(o as ServiceOrder)
    setNewStatus(o.status)

    const { data: itms } = await supabase.from('order_items').select('*').eq('order_id', o.id).order('created_at')
    setItems((itms || []) as OrderItem[])

    const { data: imgs } = await supabase.from('order_images').select('*').eq('order_id', o.id).order('created_at')
    setImages((imgs || []) as OrderImage[])

    if (o.client_id) {
      const { data: c } = await supabase.from('clients').select('*').eq('id', o.client_id).single()
      if (c) setClient(c as Client)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [params.id])

  function downloadPDF() {
    if (!order) return
    const doc = generateLaudoPDF(order, items, client?.name || 'Não informado')
    doc.save(`laudo-tecnico-OS${String(order.order_number).padStart(4, '0')}.pdf`)
  }

  async function registerPayment() {
    if (!order || payForm.amount <= 0) return
    await supabase.from('payments').insert({
      order_id: order.id,
      client_id: order.client_id || null,
      amount: payForm.amount,
      payment_method: payForm.payment_method,
      description: payForm.description || `Pagamento OS #${String(order.order_number).padStart(4, '0')}`,
      type: 'receita',
    })
    setPayModal(false)
    setPayForm({ amount: 0, payment_method: 'pix', description: '' })
    alert('Pagamento registrado!')
  }

  async function updateStatus() {
    if (!order) return
    await supabase.from('service_orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', order.id)
    setStatusModal(false)
    load()
  }

  async function handleDeleteOrder() {
    if (!order) return
    if (!confirm(`Excluir OS #${String(order.order_number).padStart(4, '0')}?\n\nTodos os itens, pagamentos e imagens relacionados serão excluídos.\n\nEssa ação não pode ser desfeita.`)) return
    setDeletingOrder(true)
    const { error } = await supabase.from('service_orders').delete().eq('id', order.id)
    if (error) {
      alert('Erro ao excluir: ' + error.message)
      setDeletingOrder(false)
    } else {
      router.push('/ordens')
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" /></div>
  }

  if (!order) return null

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/ordens" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              OS #{String(order.order_number).padStart(4, '0')}
            </h1>
            <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex flex-wrap gap-2 ml-11 sm:ml-0">
          <Link href={`/ordens/${order.id}/editar`} className="flex items-center gap-1.5 px-3 py-2 bg-brand-blue text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-brand-blue/90 transition-colors">
            <Edit2 className="w-4 h-4" /> Editar
          </Link>
          <button onClick={() => { setPayForm({...payForm, amount: order.total}); setPayModal(true) }} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm hover:bg-gray-50 transition-colors">
            <DollarSign className="w-4 h-4" /> <span className="hidden sm:inline">Registrar </span>Pagamento
          </button>
          <button onClick={() => setStatusModal(true)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm hover:bg-gray-50 transition-colors">
            <Edit2 className="w-4 h-4" /> Status
          </button>
          <button onClick={downloadPDF} className="flex items-center gap-1.5 px-3 py-2 bg-brand-dark text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-brand-dark-light transition-colors">
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button onClick={handleDeleteOrder} disabled={deletingOrder} className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-500 rounded-lg text-xs sm:text-sm hover:bg-red-50 transition-colors disabled:opacity-50">
            <Trash2 className="w-4 h-4" /> Excluir
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cliente</h3>
              <p className="text-sm font-medium text-gray-900">{client?.name || 'Não informado'}</p>
              {client?.phone && <p className="text-xs text-gray-500">{client.phone}</p>}
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Equipamento</h3>
              <p className="text-sm font-medium text-gray-900">{order.equipment}</p>
              <p className="text-xs text-gray-500">
                {[order.brand, order.model, order.color].filter(Boolean).join(' · ')}
                {order.serial_number && ` · S/N: ${order.serial_number}`}
              </p>
            </div>
          </div>
        </div>

        {/* Sintoma */}
        {order.symptom_report && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-2">1. Relato do Sintoma / Entrada</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.symptom_report}</p>
          </div>
        )}

        {/* Diagnóstico */}
        {order.technical_diagnosis && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-2">2. Diagnóstico Técnico de Bancada</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.technical_diagnosis}</p>
          </div>
        )}

        {/* Itens */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-4">3. Serviços e Peças</h3>
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
                    <td className="py-3 text-right text-lg font-bold text-brand-blue">{formatCurrency(order.total)}</td>
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
                  <span className="text-lg font-bold text-brand-blue">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Condições */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-3">4. Condições de Entrega</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div>
              <span className="text-gray-400">Prazo:</span>
              <span className="ml-2 text-gray-700">{order.execution_deadline || 'A combinar'}</span>
            </div>
            <div>
              <span className="text-gray-400">Garantia:</span>
              <span className="ml-2 text-gray-700">{order.warranty || '—'}</span>
            </div>
            {order.delivery_conditions && (
              <div className="col-span-1 sm:col-span-2">
                <span className="text-gray-400">Observações:</span>
                <p className="text-gray-700 mt-1">{order.delivery_conditions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Fotos */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
          <ImageUpload orderId={order.id} images={images} onImagesChange={setImages} />
        </div>
      </div>

      {/* Payment Modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Registrar Pagamento">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento</label>
            <select value={payForm.payment_method} onChange={e => setPayForm({...payForm, payment_method: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue">
              {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input type="text" value={payForm.description} onChange={e => setPayForm({...payForm, description: e.target.value})}
              placeholder={`Pagamento OS #${String(order.order_number).padStart(4, '0')}`}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setPayModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
            <button onClick={registerPayment} className="px-5 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">Registrar</button>
          </div>
        </div>
      </Modal>

      {/* Status Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Alterar Status">
        <div className="space-y-4">
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue">
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div className="flex justify-end gap-3">
            <button onClick={() => setStatusModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
            <button onClick={updateStatus} className="px-5 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-brand-blue/90">Salvar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default function OrdemDetalhePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" /></div>}>
      <OrdemDetalheContent />
    </Suspense>
  )
}
