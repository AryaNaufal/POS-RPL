-- Add return status to sale items
alter table public.sale_items add column if not exists return_qty numeric(14,2) not null default 0;
alter table public.sale_items add column if not exists return_reason text;

-- Add return status to purchase items
alter table public.purchase_items add column if not exists return_qty numeric(14,2) not null default 0;
alter table public.purchase_items add column if not exists return_reason text;

-- Add indexes for performance
create index if not exists idx_sale_items_product on public.sale_items (product_id);
create index if not exists idx_purchase_items_product on public.purchase_items (product_id);
