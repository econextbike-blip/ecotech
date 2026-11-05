-- ============================================
-- E-Tech Bike Elétrica - Sistema de Gestão
-- Schema do Banco de Dados (Supabase)
-- ============================================

-- Habilitar UUID
create extension if not exists "uuid-ossp";

-- ============================================
-- CLIENTES
-- ============================================
create table clients (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text,
  phone text,
  cpf_cnpj text,
  address text,
  city text default 'Uruguaiana',
  state text default 'RS',
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================
-- PRODUTOS
-- ============================================
create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  category text,
  sku text,
  cost_price numeric(10,2) default 0,
  sell_price numeric(10,2) default 0,
  stock integer default 0,
  min_stock integer default 0,
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================
-- ORDENS DE SERVIÇO
-- ============================================
create table service_orders (
  id uuid default uuid_generate_v4() primary key,
  order_number serial,
  client_id uuid references clients(id) on delete set null,
  equipment text not null,
  brand text,
  model text,
  serial_number text,
  color text,
  symptom_report text,
  technical_diagnosis text,
  delivery_conditions text,
  execution_deadline text,
  warranty text,
  status text default 'pendente' check (status in ('pendente', 'em_andamento', 'concluida', 'entregue', 'cancelada')),
  total numeric(10,2) default 0,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================
-- ITENS DA ORDEM DE SERVIÇO
-- ============================================
create table order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references service_orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  description text not null,
  quantity integer default 1,
  unit_price numeric(10,2) default 0,
  total numeric(10,2) default 0,
  item_type text default 'servico' check (item_type in ('servico', 'peca', 'produto')),
  created_at timestamp with time zone default now()
);

-- ============================================
-- PAGAMENTOS
-- ============================================
create table payments (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references service_orders(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  amount numeric(10,2) not null,
  payment_method text not null check (payment_method in ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'boleto', 'outro')),
  payment_date date default current_date,
  description text,
  type text default 'receita' check (type in ('receita', 'despesa')),
  status text default 'confirmado' check (status in ('pendente', 'confirmado', 'cancelado')),
  created_at timestamp with time zone default now()
);

-- ============================================
-- DESPESAS (avulsas, sem OS)
-- ============================================
create table expenses (
  id uuid default uuid_generate_v4() primary key,
  description text not null,
  category text,
  amount numeric(10,2) not null,
  payment_method text default 'dinheiro',
  expense_date date default current_date,
  notes text,
  created_at timestamp with time zone default now()
);

-- ============================================
-- IMAGENS DA ORDEM DE SERVIÇO
-- ============================================
create table order_images (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references service_orders(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_url text not null,
  caption text,
  created_at timestamp with time zone default now()
);

-- ============================================
-- SUPABASE STORAGE (executar no SQL Editor)
-- Bucket para imagens das ordens de serviço
-- ============================================
insert into storage.buckets (id, name, public) values ('order-images', 'order-images', true);

-- Política para permitir upload
create policy "Allow upload for all" on storage.objects for insert with check (bucket_id = 'order-images');
-- Política para permitir leitura pública
create policy "Allow public read" on storage.objects for select using (bucket_id = 'order-images');
-- Política para permitir deletar
create policy "Allow delete for all" on storage.objects for delete using (bucket_id = 'order-images');

-- ============================================
-- ÍNDICES
-- ============================================
create index idx_orders_client on service_orders(client_id);
create index idx_orders_status on service_orders(status);
create index idx_order_items_order on order_items(order_id);
create index idx_payments_order on payments(order_id);
create index idx_payments_date on payments(payment_date);
create index idx_expenses_date on expenses(expense_date);
create index idx_order_images_order on order_images(order_id);

-- ============================================
-- ROW LEVEL SECURITY (básico - permitir tudo para authenticated)
-- ============================================
alter table clients enable row level security;
alter table products enable row level security;
alter table service_orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table expenses enable row level security;

-- Políticas permissivas para usuários autenticados
create policy "Allow all for authenticated" on clients for all using (true) with check (true);
create policy "Allow all for authenticated" on products for all using (true) with check (true);
create policy "Allow all for authenticated" on service_orders for all using (true) with check (true);
create policy "Allow all for authenticated" on order_items for all using (true) with check (true);
create policy "Allow all for authenticated" on payments for all using (true) with check (true);
create policy "Allow all for authenticated" on expenses for all using (true) with check (true);
create policy "Allow all for authenticated" on order_images for all using (true) with check (true);
