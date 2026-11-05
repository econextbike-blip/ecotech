import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  cpf_cnpj?: string
  address?: string
  city?: string
  state?: string
  notes?: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  description?: string
  category?: string
  sku?: string
  cost_price: number
  sell_price: number
  stock: number
  min_stock: number
  active: boolean
  created_at: string
}

export interface ServiceOrder {
  id: string
  order_number: number
  client_id?: string
  client?: Client
  equipment: string
  brand?: string
  model?: string
  serial_number?: string
  color?: string
  symptom_report?: string
  technical_diagnosis?: string
  delivery_conditions?: string
  execution_deadline?: string
  warranty?: string
  status: 'pendente' | 'em_andamento' | 'concluida' | 'entregue' | 'cancelada'
  total: number
  notes?: string
  items?: OrderItem[]
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id?: string
  description: string
  quantity: number
  unit_price: number
  total: number
  item_type: 'servico' | 'peca' | 'produto'
}

export interface Payment {
  id: string
  order_id?: string
  client_id?: string
  client?: Client
  amount: number
  payment_method: string
  payment_date: string
  description?: string
  type: 'receita' | 'despesa'
  status: 'pendente' | 'confirmado' | 'cancelado'
  created_at: string
}

export interface Expense {
  id: string
  description: string
  category?: string
  amount: number
  payment_method: string
  expense_date: string
  notes?: string
  created_at: string
}

export interface OrderImage {
  id: string
  order_id: string
  file_name: string
  file_path: string
  file_url: string
  caption?: string
  created_at: string
}
