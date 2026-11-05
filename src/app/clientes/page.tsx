'use client'

import { useEffect, useState } from 'react'
import { supabase, Client } from '@/lib/supabase'
import { formatPhone, formatDate } from '@/lib/format'
import { Plus, Search, Edit2, Trash2, Users } from 'lucide-react'
import Modal from '@/components/Modal'

const emptyClient = { name: '', email: '', phone: '', cpf_cnpj: '', address: '', city: 'Uruguaiana', state: 'RS', notes: '' }

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState(emptyClient)

  async function loadClients() {
    let query = supabase.from('clients').select('*').order('name')
    if (search) query = query.ilike('name', `%${search}%`)
    const { data } = await query
    setClients(data || [])
    setLoading(false)
  }

  useEffect(() => { loadClients() }, [search])

  function openNew() {
    setEditing(null)
    setForm(emptyClient)
    setModalOpen(true)
  }

  function openEdit(c: Client) {
    setEditing(c)
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', cpf_cnpj: c.cpf_cnpj || '', address: c.address || '', city: c.city || '', state: c.state || '', notes: c.notes || '' })
    setModalOpen(true)
  }

  async function save() {
    if (!form.name.trim()) return alert('Nome é obrigatório')
    if (editing) {
      await supabase.from('clients').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id)
    } else {
      await supabase.from('clients').insert(form)
    }
    setModalOpen(false)
    loadClients()
  }

  async function remove(id: string) {
    if (!confirm('Excluir este cliente?')) return
    await supabase.from('clients').delete().eq('id', id)
    loadClients()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">{clients.length} clientes cadastrados</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-brand-blue/90 transition-colors">
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-blue" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Nenhum cliente encontrado.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Telefone</th>
                <th className="px-5 py-3">E-mail</th>
                <th className="px-5 py-3">Cidade</th>
                <th className="px-5 py-3">Cadastro</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{c.phone ? formatPhone(c.phone) : '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{c.email || '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{c.city}/{c.state}</td>
                  <td className="px-5 py-3 text-sm text-gray-400">{formatDate(c.created_at)}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 ml-1"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Cliente' : 'Novo Cliente'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ</label>
              <input type="text" value={form.cpf_cnpj} onChange={e => setForm({...form, cpf_cnpj: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <input type="text" value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
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
