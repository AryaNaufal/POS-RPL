create table if not exists public.stock_opnames (
  id uuid primary key default gen_random_uuid(),
  opname_no text not null unique,
  store_id uuid not null references public.stores(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'completed', 'cancelled')),
  note text,
  created_by uuid references public.users(id) on delete set null,
  completed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.stock_opname_items (
  id uuid primary key default gen_random_uuid(),
  opname_id uuid not null references public.stock_opnames(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  qty_expected numeric(14,2) not null default 0,
  qty_actual numeric(14,2) not null default 0,
  adjustment_qty numeric(14,2) not null default 0,
  created_at timestamp with time zone not null default now()
);

create trigger trg_set_updated_at_stock_opnames
before update on public.stock_opnames
for each row execute procedure public.set_updated_at();

create index if not exists idx_stock_opnames_store on public.stock_opnames (store_id);
create index if not exists idx_stock_opname_items_opname on public.stock_opname_items (opname_id);
