create table if not exists public.stock_transfers (
  id uuid primary key default gen_random_uuid(),
  transfer_no text not null unique,
  from_store_id uuid not null references public.stores(id) on delete restrict,
  to_store_id uuid not null references public.stores(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'shipped', 'received', 'cancelled')),
  note text,
  created_by uuid references public.users(id) on delete set null,
  shipped_at timestamp with time zone,
  received_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.stock_transfer_items (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references public.stock_transfers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  qty numeric(14,2) not null check (qty > 0),
  created_at timestamp with time zone not null default now()
);

create trigger trg_set_updated_at_stock_transfers
before update on public.stock_transfers
for each row execute procedure public.set_updated_at();

create index if not exists idx_stock_transfers_from_store on public.stock_transfers (from_store_id);
create index if not exists idx_stock_transfers_to_store on public.stock_transfers (to_store_id);
create index if not exists idx_stock_transfer_items_transfer on public.stock_transfer_items (transfer_id);
