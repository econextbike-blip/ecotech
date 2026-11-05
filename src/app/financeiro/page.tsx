'use client'

import { useEffect, useState } from 'react'
import { supabase, Payment, Expense } from '@/lib/supabase'
import { formatCurrency, formatDate, PAYMENT_LABELS } from '@/lib/format'
import { Plus, TrendingUp, TrendingDown, DollarSign, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import Modal from '@/components/Modal'

export default function FinanceiroPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'receitas' | 'despesas'>('receitas')
  const [month, setMonth] = useState('')
  const [payModal, setPayModal] = useState(false)
  const [expModal, setExpModal] = useState(false)
  const [payForm, setPayForm] = useState({ amount: 0, payment_method: 'pix', description: '', payment_date: '' })
  const [expForm, setExpForm] = useState({ amount: 0, description: '', category: '', payment_method: 'dinheiro', expense_date: '', notes: '' })

  useEffect(() => {
    const now = new Date()
    const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const today = now.toISOString().split('T')[0]
    setMonth(m)
    setPayForm(f => ({ ...f, payment_date: today }))
    setExpForm(f => ({ ...f, expense_date: today }))
  }, [])

  async function load() {
    const [year, m] = month.split('-').map(Number)
    const start = new Date(year, m - 1, 1).toISOString().split('T')[0]
    const end = new Date(year, m, 0).toISOString().split('T')[0]

    const [p, e] = await Promise.all([
      supabase.from('payments').select('*, clients(name)').gte('payment_date', start).lte('payment_date', end).order('payment_date', { ascending: false }),
      supabase.from('expenses').select('*').gte('expense_date', start).lte('expense_date', end).order('expense_date', { ascending: false }),
    ])
    setPayments((p.data || []) as Payment[])
    setExpenses((e.data || []) as Expense[])
    setLoading(false)
  }

  useEffect(() => { if (month) { setLoading(true); load() } }, [month])

  const totalReceitas = payments.filter(p => p.status === 'confirmado').reduce((s, p) => s + Number(p.amount), 0)
  const totalDespesas = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const saldo = totalReceitas - totalDespesas

  async function savePayment() {
    if (payForm.amount <= 0 || !payForm.description.trim()) return alert('Preencha valor e descrição')
    await supabase.from('payments').insert({ ...payForm, type: 'receita', status: 'confirmado' })
    setPayModal(false)
    setPayForm({ amount: 0, payment_method: 'pix', description: '', payment_date: new Date().toISOString().split('T')[0] })
    load()
  }

  async function saveExpense() {
    if (expForm.amount <= 0 || !expForm.description.trim()) return alert('Preencha valor e descrição')
    await supabase.from('expenses').insert(expForm)
    setExpModal(false)
    setExpForm({ amount: 0, description: '', category: '', payment_method: 'dinheiro', expense_date: new Date().toISOString().split('T')[0], notes: '' })
    load()
  }

  const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-sm text-gray-500 mt-1">Controle de receitas e despesas</p>
        </div>
        <div className="flex gap-2">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
          <button onClick={() => setPayModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
            <ArrowUpCircle className="w-4 h-4" /> Receita
          </button>
          <button onClick={() => setExpModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
            <ArrowDownCircle className="w-4 h-4" /> Despesa
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Receitas</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalReceitas)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Despesas</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalDespesas)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${saldo >= 0 ? 'bg-blue-50' : 'bg-red-50'} rounded-xl flex items-center justify-center`}>
              <DollarSign className={`w-5 h-5 ${saldo >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Saldo</p>
              <p className={`text-xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(saldo)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex border-b border-gray-100">
          <button onClick={() => setTab('receitas')} className={`px-6 py-3 text-sm font-medium transition-colors ${tab === 'receitas' ? 'text-green-600 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-700'}`}>
            Receitas ({payments.length})
          </button>
          <button onClick={() => setTab('despesas')} className={`px-6 py-3 text-sm font-medium transition-colors ${tab === 'despesas' ? 'text-red-600 border-b-2 border-red-500' : 'text-gray-500 hover:text-gray-700'}`}>
            Despesas ({expenses.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-blue" /></div>
        ) : tab === 'receitas' ? (
          payments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">Nenhuma receita no período.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Descrição</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Método</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm text-gray-600">{formatDate(p.payment_date)}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{p.description || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{(p.client as unknown as { name: string })?.name || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{PAYMENT_LABELS[p.payment_method] || p.payment_method}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'confirmado' ? 'bg-green-100 text-green-700' : p.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {p.status === 'confirmado' ? 'Confirmado' : p.status === 'pendente' ? 'Pendente' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-green-600 text-right">{formatCurrency(Number(p.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          expenses.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">Nenhuma despesa no período.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Descrição</th>
                  <th className="px-5 py-3">Categoria</th>
                  <th className="px-5 py-3">Método</th>
                  <th className="px-5 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm text-gray-600">{formatDate(e.expense_date)}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{e.description}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{e.category || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{PAYMENT_LABELS[e.payment_method] || e.payment_method}</td>
                    <td className="px-5 py-3 text-sm font-bold text-red-600 text-right">{formatCurrency(Number(e.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* Payment Modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Nova Receita">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
            <input type="text" value={payForm.description} onChange={e => setPayForm({...payForm, description: e.target.value})} placeholder="Ex: Serviço de manutenção" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
              <input type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: Number(e.target.value)})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input type="date" value={payForm.payment_date} onChange={e => setPayForm({...payForm, payment_date: e.target.value})} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento</label>
            <select value={payForm.payment_method} onChange={e => setPayForm({...payForm, payment_method: e.target.value})} className={inputClass}>
              {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setPayModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
            <button onClick={savePayment} className="px-5 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">Salvar</button>
          </div>
        </div>
      </Modal>

      {/* Expense Modal */}
      <Modal open={expModal} onClose={() => setExpModal(false)} title="Nova Despesa">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
            <input type="text" value={expForm.description} onChange={e => setExpForm({...expForm, description: e.target.value})} placeholder="Ex: Aluguel, Fornecedor" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
              <input type="number" step="0.01" value={expForm.amount} onChange={e => setExpForm({...expForm, amount: Number(e.target.value)})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input type="date" value={expForm.expense_date} onChange={e => setExpForm({...expForm, expense_date: e.target.value})} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <input type="text" value={expForm.category} onChange={e => setExpForm({...expForm, category: e.target.value})} placeholder="Ex: Aluguel, Material" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento</label>
              <select value={expForm.payment_method} onChange={e => setExpForm({...expForm, payment_method: e.target.value})} className={inputClass}>
                {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea value={expForm.notes} onChange={e => setExpForm({...expForm, notes: e.target.value})} rows={2} className={inputClass} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setExpModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
            <button onClick={saveExpense} className="px-5 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">Salvar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
