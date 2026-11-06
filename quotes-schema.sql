-- ============================================
-- ORÇAMENTOS
-- ============================================
create table quotes (
  id uuid default uuid_generate_v4() primary key,
  quote_number serial,
  client_id uuid references clients(id) on delete set null,
  equipment text not null,
  brand text,
  model text,
  serial_number text,
  color text,
  reported_issue text,
  proposed_solution text,
  status text default 'pendente' check (status in ('pendente', 'aprovado', 'rejeitado', 'expirado')),
  total numeric(10,2) default 0,
  validity_days integer default 15,
  notes text,
  converted_order_id uuid references service_orders(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ============================================
-- ITENS DO ORÇAMENTO
-- ============================================
create table quote_items (
  id uuid default uuid_generate_v4() primary key,
  quote_id uuid references quotes(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  description text not null,
  quantity integer default 1,
  unit_price numeric(10,2) default 0,
  total numeric(10,2) default 0,
  item_type text default 'servico' check (item_type in ('servico', 'peca', 'produto')),
  created_at timestamp with time zone default now()
);

-- ============================================
-- ÍNDICES
-- ============================================
create index idx_quotes_client on quotes(client_id);
create index idx_quotes_status on quotes(status);
create index idx_quote_items_quote on quote_items(quote_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table quotes enable row level security;
alter table quote_items enable row level security;

create policy "Allow all for authenticated" on quotes for all using (true) with check (true);
create policy "Allow all for authenticated" on quote_items for all using (true) with check (true);
