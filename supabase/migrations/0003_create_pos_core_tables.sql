create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  phone text,
  email text,
  address text,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.roles (
  id smallint primary key generated always as identity,
  code text not null unique,
  name text not null unique,
  created_at timestamp with time zone not null default now()
);

insert into public.roles (code, name)
values
  ('admin', 'Admin'),
  ('kasir', 'Kasir'),
  ('owner', 'Owner')
on conflict (code) do nothing;

create table if not exists public.user_store_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  role_id smallint not null references public.roles(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  unique (user_id, store_id, role_id)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  phone text,
  email text,
  address text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  phone text,
  email text,
  address text,
  contact_person text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.product_units (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  symbol text not null unique,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.product_categories(id) on delete set null,
  code text unique,
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  barcode text unique,
  name text not null,
  description text,
  category_id uuid references public.product_categories(id) on delete set null,
  unit_id uuid references public.product_units(id) on delete set null,
  buy_price numeric(14,2) not null default 0 check (buy_price >= 0),
  sell_price numeric(14,2) not null default 0 check (sell_price >= 0),
  min_stock numeric(14,2) not null default 0 check (min_stock >= 0),
  track_stock boolean not null default true,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.product_stocks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  qty_on_hand numeric(14,2) not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (product_id, store_id)
);

create table if not exists public.cashier_shifts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  cashier_id uuid not null references public.users(id) on delete restrict,
  opened_at timestamp with time zone not null default now(),
  opening_cash numeric(14,2) not null default 0 check (opening_cash >= 0),
  closed_at timestamp with time zone,
  closing_cash numeric(14,2),
  expected_cash numeric(14,2),
  cash_difference numeric(14,2),
  status text not null default 'open' check (status in ('open', 'closed')),
  note text
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,
  store_id uuid not null references public.stores(id) on delete restrict,
  cashier_id uuid not null references public.users(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  shift_id uuid references public.cashier_shifts(id) on delete set null,
  status text not null default 'completed' check (status in ('draft', 'completed', 'void', 'refunded')),
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  discount_total numeric(14,2) not null default 0 check (discount_total >= 0),
  tax_total numeric(14,2) not null default 0 check (tax_total >= 0),
  service_total numeric(14,2) not null default 0 check (service_total >= 0),
  grand_total numeric(14,2) not null default 0 check (grand_total >= 0),
  paid_total numeric(14,2) not null default 0 check (paid_total >= 0),
  change_total numeric(14,2) not null default 0 check (change_total >= 0),
  note text,
  sold_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now()
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  sku_snapshot text,
  qty numeric(14,2) not null check (qty > 0),
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  tax_amount numeric(14,2) not null default 0 check (tax_amount >= 0),
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  total numeric(14,2) not null default 0 check (total >= 0),
  created_at timestamp with time zone not null default now()
);

create table if not exists public.sale_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  payment_method text not null check (payment_method in ('cash', 'qris', 'card', 'transfer', 'ewallet', 'credit')),
  amount numeric(14,2) not null check (amount > 0),
  reference_no text,
  paid_at timestamp with time zone not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  purchase_no text not null unique,
  store_id uuid not null references public.stores(id) on delete restrict,
  supplier_id uuid references public.suppliers(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'ordered', 'received', 'cancelled')),
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  discount_total numeric(14,2) not null default 0 check (discount_total >= 0),
  tax_total numeric(14,2) not null default 0 check (tax_total >= 0),
  grand_total numeric(14,2) not null default 0 check (grand_total >= 0),
  note text,
  ordered_at timestamp with time zone not null default now(),
  received_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  qty numeric(14,2) not null check (qty > 0),
  unit_cost numeric(14,2) not null default 0 check (unit_cost >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  tax_amount numeric(14,2) not null default 0 check (tax_amount >= 0),
  total numeric(14,2) not null default 0 check (total >= 0),
  created_at timestamp with time zone not null default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  store_id uuid not null references public.stores(id) on delete restrict,
  movement_type text not null check (
    movement_type in (
      'opening',
      'sale',
      'sale_return',
      'purchase',
      'purchase_return',
      'adjustment_in',
      'adjustment_out',
      'transfer_in',
      'transfer_out'
    )
  ),
  qty numeric(14,2) not null check (qty > 0),
  unit_cost numeric(14,2),
  reference_type text,
  reference_id uuid,
  note text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  shift_id uuid references public.cashier_shifts(id) on delete set null,
  movement_type text not null check (movement_type in ('in', 'out')),
  amount numeric(14,2) not null check (amount > 0),
  reason text not null,
  reference_type text,
  reference_id uuid,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  category text not null,
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  expense_date date not null default current_date,
  paid_by uuid references public.users(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.audit_logs (
  id bigint primary key generated always as identity,
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamp with time zone not null default now()
);

alter table public.users
  add column if not exists is_active boolean not null default true,
  add column if not exists last_login_at timestamp with time zone,
  add column if not exists updated_at timestamp with time zone not null default now();

create trigger trg_set_updated_at_users
before update on public.users
for each row execute procedure public.set_updated_at();

create trigger trg_set_updated_at_stores
before update on public.stores
for each row execute procedure public.set_updated_at();

create trigger trg_set_updated_at_customers
before update on public.customers
for each row execute procedure public.set_updated_at();

create trigger trg_set_updated_at_suppliers
before update on public.suppliers
for each row execute procedure public.set_updated_at();

create trigger trg_set_updated_at_product_categories
before update on public.product_categories
for each row execute procedure public.set_updated_at();

create trigger trg_set_updated_at_products
before update on public.products
for each row execute procedure public.set_updated_at();

create trigger trg_set_updated_at_product_stocks
before update on public.product_stocks
for each row execute procedure public.set_updated_at();

create trigger trg_set_updated_at_app_settings
before update on public.app_settings
for each row execute procedure public.set_updated_at();

create index if not exists idx_user_store_roles_user_id on public.user_store_roles (user_id);
create index if not exists idx_user_store_roles_store_id on public.user_store_roles (store_id);
create index if not exists idx_products_category_id on public.products (category_id);
create index if not exists idx_products_name on public.products (name);
create index if not exists idx_product_stocks_product_store on public.product_stocks (product_id, store_id);
create index if not exists idx_sales_store_id on public.sales (store_id);
create index if not exists idx_sales_cashier_id on public.sales (cashier_id);
create index if not exists idx_sales_sold_at on public.sales (sold_at);
create index if not exists idx_sale_items_sale_id on public.sale_items (sale_id);
create index if not exists idx_sale_payments_sale_id on public.sale_payments (sale_id);
create index if not exists idx_purchases_store_id on public.purchases (store_id);
create index if not exists idx_purchases_supplier_id on public.purchases (supplier_id);
create index if not exists idx_stock_movements_product_store on public.stock_movements (product_id, store_id);
create index if not exists idx_stock_movements_created_at on public.stock_movements (created_at);
create index if not exists idx_cash_movements_store_shift on public.cash_movements (store_id, shift_id);
create index if not exists idx_expenses_store_date on public.expenses (store_id, expense_date);
create index if not exists idx_audit_logs_entity on public.audit_logs (entity_type, entity_id);
create index if not exists idx_users_email_lower on public.users ((lower(email)));

