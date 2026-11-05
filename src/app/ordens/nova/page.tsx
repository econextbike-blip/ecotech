'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Client, Product } from '@/lib/supabase'
import { Plus, Trash2, ArrowLeft, UserPlus, UserCheck } from 'lucide-react'
import Link from 'next/link'

interface ItemForm {
  description: string
  quantity: number
  unit_price: number
  item_type: 'servico' | 'peca' | 'produto'
  product_id?: string
}

function NovaOrdemContent() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)

  // Cliente: modo "novo" ou "existente"
  const [clientMode, setClientMode] = useState<'novo' | 'existente'>('novo')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    cpf_cnpj: '',
    email: '',
    address: '',
  })

  const [form, setForm] = useState({
    equipment: '',
    brand: '',
    model: '',
    serial_number: '',
    color: '',
    symptom_report: '',
    technical_diagnosis: '',
    delivery_conditions: '',
    execution_deadline: '',
    warranty: '90 dias para serviço',
  })

  const [items, setItems] = useState<ItemForm[]>([
    { description: '', quantity: 1, unit_price: 0, item_type: 'servico' },
  ])

  useEffect(() => {
    supabase.from('clients').select('*').order('name').then(({ data }) => setClients((data || []) as Client[]))
    supabase.from('products').select('*').eq('active', true).order('name').then(({ data }) => setProducts((data || []) as Product[]))
  }, [])

  function addItem() {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, item_type: 'servico' }])
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i))
  }

  function updateItem(i: number, field: string, value: string | number) {
    const updated = [...items]
    if (field === 'product_id') {
      const product = products.find(p => p.id === value)
      if (product) {
        updated[i] = { ...updated[i], product_id: product.id, description: product.name, unit_price: product.sell_price, item_type: 'peca' }
      }
    } else {
      ;(updated[i] as unknown as Record<string, unknown>)[field] = value
    }
    setItems(updated)
  }

  const total = items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0)

  async function save() {
    if (!form.equipment.trim()) return alert('Equipamento é obrigatório')

    // Validar cliente
    if (clientMode === 'novo' && !newClient.name.trim()) {
      return alert('Nome do cliente é obrigatório')
    }

    setSaving(true)

    let clientId: string | null = null

    try {
      if (clientMode === 'existente' && selectedClientId) {
        clientId = selectedClientId
      } else if (clientMode === 'novo' && newClient.name.trim()) {
        // Criar cliente novo
        const { data: createdClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: newClient.name.trim(),
            phone: newClient.phone.trim() || null,
            cpf_cnpj: newClient.cpf_cnpj.trim() || null,
            email: newClient.email.trim() || null,
            address: newClient.address.trim() || null,
          })
          .select('id')
          .single()

        if (clientError || !createdClient) {
          alert('Erro ao cadastrar cliente: ' + (clientError?.message || 'desconhecido'))
          setSaving(false)
          return
        }
        clientId = createdClient.id
      }

      // Criar ordem de serviço
      const { data: order, error } = await supabase.from('service_orders').insert({
        ...form,
        client_id: clientId,
        total,
      }).select('id').single()

      if (error || !order) {
        alert('Erro ao criar ordem: ' + (error?.message || 'desconhecido'))
        setSaving(false)
        return
      }

      // Inserir itens
      const orderItems = items.filter(it => it.description.trim()).map(it => ({
        order_id: order.id,
        product_id: it.product_id || null,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total: it.quantity * it.unit_price,
        item_type: it.item_type,
      }))

      if (orderItems.length > 0) {
        await supabase.from('order_items').insert(orderItems)
      }

      router.push(`/ordens/${order.id}`)
    } catch (err) {
      alert('Erro inesperado. Tente novamente.')
      setSaving(false)
    }
  }

  const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ordens" className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Ordem de Serviço</h1>
          <p className="text-sm text-gray-500">Preencha os dados do serviço</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Cliente */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Cliente</h2>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setClientMode('novo')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  clientMode === 'novo'
                    ? 'bg-brand-blue text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Novo Cliente
              </button>
              <button
                onClick={() => setClientMode('existente')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  clientMode === 'existente'
                    ? 'bg-brand-blue text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" /> Cliente Existente
              </button>
            </div>
          </div>

          {clientMode === 'novo' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input type="text" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} placeholder="Nome do cliente" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input type="text" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} placeholder="(55) 99999-9999" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF / CNPJ</label>
                <input type="text" value={newClient.cpf_cnpj} onChange={e => setNewClient({...newClient, cpf_cnpj: e.target.value})} placeholder="000.000.000-00" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} placeholder="email@exemplo.com" className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input type="text" value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})} placeholder="Rua, nº - Bairro" className={inputClass} />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o cliente</label>
              <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className={inputClass}>
                <option value="">Selecione...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `— ${c.phone}` : ''}
                  </option>
                ))}
              </select>
              {clients.length === 0 && (
                <p className="text-xs text-gray-400 mt-2">Nenhum cliente cadastrado. Use &quot;Novo Cliente&quot; para cadastrar.</p>
              )}
            </div>
          )}
        </div>

        {/* Equipamento */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Dados do Equipamento</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipamento *</label>
              <input type="text" value={form.equipment} onChange={e => setForm({...form, equipment: e.target.value})} placeholder="Ex: Bike Elétrica" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input type="text" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input type="text" value={form.model} onChange={e => setForm({...form, model: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Série</label>
              <input type="text" value={form.serial_number} onChange={e => setForm({...form, serial_number: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
              <input type="text" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Sintoma e Diagnóstico */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Diagnóstico</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">1. Relato do Sintoma / Entrada</label>
              <textarea value={form.symptom_report} onChange={e => setForm({...form, symptom_report: e.target.value})} rows={3} className={inputClass} placeholder="Descreva o problema relatado pelo cliente..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">2. Diagnóstico Técnico de Bancada</label>
              <textarea value={form.technical_diagnosis} onChange={e => setForm({...form, technical_diagnosis: e.target.value})} rows={3} className={inputClass} placeholder="Diagnóstico técnico após avaliação..." />
            </div>
          </div>
        </div>

        {/* Serviços e Peças */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">3. Serviços e Peças</h2>
            <button onClick={addItem} className="flex items-center gap-1 text-sm text-brand-blue hover:text-brand-blue/80">
              <Plus className="w-4 h-4" /> Adicionar item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-12 gap-3">
                  <div className="col-span-2">
                    <select value={item.item_type} onChange={e => updateItem(i, 'item_type', e.target.value)} className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/20">
                      <option value="servico">Serviço</option>
                      <option value="peca">Peça</option>
                      <option value="produto">Produto</option>
                    </select>
                  </div>
                  {(item.item_type === 'peca' || item.item_type === 'produto') && (
                    <div className="col-span-3">
                      <select onChange={e => updateItem(i, 'product_id', e.target.value)} className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/20">
                        <option value="">Do catálogo...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} — R${p.sell_price.toFixed(2)}</option>)}
                      </select>
                    </div>
                  )}
                  <div className={item.item_type === 'servico' ? 'col-span-6' : 'col-span-3'}>
                    <input type="text" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Descrição" className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/20" />
                  </div>
                  <div className="col-span-1">
                    <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} min={1} className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-brand-blue/20" />
                  </div>
                  <div className="col-span-2">
                    <input type="number" step="0.01" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', Number(e.target.value))} className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs text-right focus:outline-none focus:ring-2 focus:ring-brand-blue/20" placeholder="R$" />
                  </div>
                  <div className="col-span-1 flex items-center justify-end text-xs font-medium text-gray-700">
                    R$ {(item.quantity * item.unit_price).toFixed(2)}
                  </div>
                </div>
                <button onClick={() => removeItem(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 mt-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">R$ {total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Condições */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">4. Condições de Entrega</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de Execução</label>
              <input type="text" value={form.execution_deadline} onChange={e => setForm({...form, execution_deadline: e.target.value})} placeholder="Ex: 3 dias úteis" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Garantia</label>
              <input type="text" value={form.warranty} onChange={e => setForm({...form, warranty: e.target.value})} className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea value={form.delivery_conditions} onChange={e => setForm({...form, delivery_conditions: e.target.value})} rows={2} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/ordens" className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-800">Cancelar</Link>
          <button onClick={save} disabled={saving} className="px-6 py-2.5 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-brand-blue/90 disabled:opacity-50 transition-colors">
            {saving ? 'Salvando...' : 'Criar Ordem de Serviço'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NovaOrdemPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" /></div>}>
      <NovaOrdemContent />
    </Suspense>
  )
}
