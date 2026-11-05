'use client'

import { useEffect, useState } from 'react'
import { supabase, Product } from '@/lib/supabase'
import { formatCurrency } from '@/lib/format'
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react'
import Modal from '@/components/Modal'

const emptyProduct = { name: '', description: '', category: '', sku: '', cost_price: 0, sell_price: 0, stock: 0, min_stock: 0 }

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyProduct)

  async function load() {
    let query = supabase.from('products').select('*').eq('active', true).order('name')
    if (search) query = query.ilike('name', `%${search}%`)
    const { data } = await query
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [search])

  function openNew() {
    setEditing(null)
    setForm(emptyProduct)
    setModalOpen(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({ name: p.name, description: p.description || '', category: p.category || '', sku: p.sku || '', cost_price: p.cost_price, sell_price: p.sell_price, stock: p.stock, min_stock: p.min_stock })
    setModalOpen(true)
  }

  async function save() {
    if (!form.name.trim()) return alert('Nome é obrigatório')
    if (editing) {
      await supabase.from('products').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id)
    } else {
      await supabase.from('products').insert(form)
    }
    setModalOpen(false)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Excluir este produto?')) return
    await supabase.from('products').update({ active: false }).eq('id', id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos / Peças</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} itens ativos</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-brand-blue/90 transition-colors">
          <Plus className="w-4 h-4" /> Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-blue" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Nenhum produto encontrado.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3">Produto</th>
                <th className="px-5 py-3">Categoria</th>
                <th className="px-5 py-3 text-right">Custo</th>
                <th className="px-5 py-3 text-right">Venda</th>
                <th className="px-5 py-3 text-center">Estoque</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    {p.sku && <p className="text-xs text-gray-400">SKU: {p.sku}</p>}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{p.category || '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600 text-right">{formatCurrency(p.cost_price)}</td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(p.sell_price)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.stock <= p.min_stock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 ml-1"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Produto' : 'Novo Produto'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Ex: Peça, Acessório" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input type="text" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Custo (R$)</label>
              <input type="number" step="0.01" value={form.cost_price} onChange={e => setForm({...form, cost_price: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Venda (R$)</label>
              <input type="number" step="0.01" value={form.sell_price} onChange={e => setForm({...form, sell_price: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
              <input type="number" value={form.stock} onChange={e => setForm({...form, stock: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo</label>
              <input type="number" value={form.min_stock} onChange={e => setForm({...form, min_stock: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
            <button onClick={save} className="px-5 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-brand-blue/90">Salvar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
