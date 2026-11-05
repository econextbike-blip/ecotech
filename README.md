# Eco Tech — Sistema de Gestão

Sistema de gestão de vendas e serviços para **E-Tech Bike Elétrica** (Uruguaiana, RS).

## Funcionalidades

- **Dashboard** — Visão geral: clientes, produtos, OS abertas, receita mensal, estoque baixo
- **Ordens de Serviço** — Cadastro completo com geração de PDF (Laudo Técnico & Orçamento)
- **Produtos / Peças** — Catálogo com controle de estoque e preço de custo/venda
- **Clientes** — Cadastro com CPF/CNPJ, telefone, endereço
- **Financeiro** — Controle de receitas e despesas por mês, múltiplos métodos de pagamento

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **Supabase** (PostgreSQL + Auth + RLS)
- **Vercel** (Deploy)
- **jsPDF** (Geração de PDF do Laudo Técnico)

---

## Deploy — Passo a Passo

### 1. Supabase

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto (escolha região `South America (São Paulo)`)
3. Vá em **SQL Editor** e cole todo o conteúdo do arquivo `supabase-schema.sql`
4. Execute o SQL para criar as tabelas
5. Vá em **Settings → API** e copie:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public key** (começa com `eyJ...`)

### 2. GitHub

1. Crie um repositório no GitHub (ex: `ecotech-system`)
2. No terminal, dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "feat: sistema de gestão Eco Tech completo"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/ecotech-system.git
git push -u origin main
```

### 3. Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta GitHub
2. Clique em **Add New → Project**
3. Importe o repositório `ecotech-system`
4. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = a URL do seu projeto Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = a chave anon do Supabase
5. Clique em **Deploy**

Pronto! O sistema estará acessível no domínio gerado pela Vercel.

### 4. Desenvolvimento Local

```bash
# Clone o repositório
git clone https://github.com/SEU-USUARIO/ecotech-system.git
cd ecotech-system

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Rode o servidor de desenvolvimento
npm run dev
```

---

## Estrutura do Banco de Dados

| Tabela | Descrição |
|--------|-----------|
| `clients` | Cadastro de clientes |
| `products` | Catálogo de produtos e peças |
| `service_orders` | Ordens de serviço |
| `order_items` | Itens de cada OS (serviços, peças, produtos) |
| `payments` | Pagamentos recebidos |
| `expenses` | Despesas da empresa |

## Métodos de Pagamento

Dinheiro, PIX, Cartão de Crédito, Cartão de Débito, Transferência, Boleto, Outro.

## PDF — Laudo Técnico

A geração do PDF replica o layout do laudo técnico da Eco Tech, com:
- Cabeçalho escuro com logo e CNPJ
- Badge azul "LAUDO TÉCNICO & ORÇAMENTO"
- Seções: Sintoma, Diagnóstico, Serviços/Peças (tabela), Condições de Entrega
- Linhas de assinatura e rodapé

---

**Eco Tech** — O Futuro Se Move Aqui.
