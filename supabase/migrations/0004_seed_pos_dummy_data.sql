-- Seed dummy data for POS core schema (idempotent)

insert into public.roles (code, name)
values
  ('admin', 'Admin'),
  ('kasir', 'Kasir'),
  ('owner', 'Owner')
on conflict (code) do nothing;

insert into public.stores (code, name, phone, email, address, is_active)
values
  ('STR-001', 'Toko Pusat', '081200000001', 'store1@pos.local', 'Jl. Merdeka No. 1', true),
  ('STR-002', 'Toko Cabang 1', '081200000002', 'store2@pos.local', 'Jl. Merdeka No. 2', true),
  ('STR-003', 'Toko Cabang 2', '081200000003', 'store3@pos.local', 'Jl. Merdeka No. 3', true),
  ('STR-004', 'Toko Cabang 3', '081200000004', 'store4@pos.local', 'Jl. Merdeka No. 4', true),
  ('STR-005', 'Toko Cabang 4', '081200000005', 'store5@pos.local', 'Jl. Merdeka No. 5', true),
  ('STR-006', 'Toko Cabang 5', '081200000006', 'store6@pos.local', 'Jl. Merdeka No. 6', true),
  ('STR-007', 'Toko Cabang 6', '081200000007', 'store7@pos.local', 'Jl. Merdeka No. 7', true),
  ('STR-008', 'Toko Cabang 7', '081200000008', 'store8@pos.local', 'Jl. Merdeka No. 8', true),
  ('STR-009', 'Toko Cabang 8', '081200000009', 'store9@pos.local', 'Jl. Merdeka No. 9', true),
  ('STR-010', 'Toko Cabang 9', '081200000010', 'store10@pos.local', 'Jl. Merdeka No. 10', true)
on conflict (code) do nothing;

insert into public.users (name, email, password_hash, is_active)
values
  ('Seed User 01', 'seed.user01@pos.local', 'seedsalt:7f0a0fcb5b1a8eac8f4b5f57c47c54629ea8d76e28f520f5da8a8cc80a8f2f63', true),
  ('Seed User 02', 'seed.user02@pos.local', 'seedsalt:7f0a0fcb5b1a8eac8f4b5f57c47c54629ea8d76e28f520f5da8a8cc80a8f2f63', true),
  ('Seed User 03', 'seed.user03@pos.local', 'seedsalt:7f0a0fcb5b1a8eac8f4b5f57c47c54629ea8d76e28f520f5da8a8cc80a8f2f63', true),
  ('Seed User 04', 'seed.user04@pos.local', 'seedsalt:7f0a0fcb5b1a8eac8f4b5f57c47c54629ea8d76e28f520f5da8a8cc80a8f2f63', true),
  ('Seed User 05', 'seed.user05@pos.local', 'seedsalt:7f0a0fcb5b1a8eac8f4b5f57c47c54629ea8d76e28f520f5da8a8cc80a8f2f63', true),
  ('Seed User 06', 'seed.user06@pos.local', 'seedsalt:7f0a0fcb5b1a8eac8f4b5f57c47c54629ea8d76e28f520f5da8a8cc80a8f2f63', true),
  ('Seed User 07', 'seed.user07@pos.local', 'seedsalt:7f0a0fcb5b1a8eac8f4b5f57c47c54629ea8d76e28f520f5da8a8cc80a8f2f63', true),
  ('Seed User 08', 'seed.user08@pos.local', 'seedsalt:7f0a0fcb5b1a8eac8f4b5f57c47c54629ea8d76e28f520f5da8a8cc80a8f2f63', true),
  ('Seed User 09', 'seed.user09@pos.local', 'seedsalt:7f0a0fcb5b1a8eac8f4b5f57c47c54629ea8d76e28f520f5da8a8cc80a8f2f63', true),
  ('Seed User 10', 'seed.user10@pos.local', 'seedsalt:7f0a0fcb5b1a8eac8f4b5f57c47c54629ea8d76e28f520f5da8a8cc80a8f2f63', true)
on conflict (email) do nothing;

insert into public.user_store_roles (user_id, store_id, role_id, is_active)
select
  u.id,
  s.id,
  r.id,
  true
from (
  select id, row_number() over (order by email) as rn
  from public.users
  where email like 'seed.user%@pos.local'
) u
join (
  select id, row_number() over (order by code) as rn
  from public.stores
  where code like 'STR-%'
) s on s.rn = u.rn
join public.roles r on r.code = case when u.rn in (1, 2) then 'admin' else 'kasir' end
on conflict (user_id, store_id, role_id) do nothing;

insert into public.customers (code, name, phone, email, address)
values
  ('CUST-001', 'Pelanggan 01', '082100000001', 'cust01@pos.local', 'Kota A'),
  ('CUST-002', 'Pelanggan 02', '082100000002', 'cust02@pos.local', 'Kota B'),
  ('CUST-003', 'Pelanggan 03', '082100000003', 'cust03@pos.local', 'Kota C'),
  ('CUST-004', 'Pelanggan 04', '082100000004', 'cust04@pos.local', 'Kota D'),
  ('CUST-005', 'Pelanggan 05', '082100000005', 'cust05@pos.local', 'Kota E'),
  ('CUST-006', 'Pelanggan 06', '082100000006', 'cust06@pos.local', 'Kota F'),
  ('CUST-007', 'Pelanggan 07', '082100000007', 'cust07@pos.local', 'Kota G'),
  ('CUST-008', 'Pelanggan 08', '082100000008', 'cust08@pos.local', 'Kota H'),
  ('CUST-009', 'Pelanggan 09', '082100000009', 'cust09@pos.local', 'Kota I'),
  ('CUST-010', 'Pelanggan 10', '082100000010', 'cust10@pos.local', 'Kota J')
on conflict (code) do nothing;

insert into public.suppliers (code, name, phone, email, address, contact_person)
values
  ('SUP-001', 'Supplier 01', '083100000001', 'sup01@pos.local', 'Gudang A', 'CP 01'),
  ('SUP-002', 'Supplier 02', '083100000002', 'sup02@pos.local', 'Gudang B', 'CP 02'),
  ('SUP-003', 'Supplier 03', '083100000003', 'sup03@pos.local', 'Gudang C', 'CP 03'),
  ('SUP-004', 'Supplier 04', '083100000004', 'sup04@pos.local', 'Gudang D', 'CP 04'),
  ('SUP-005', 'Supplier 05', '083100000005', 'sup05@pos.local', 'Gudang E', 'CP 05'),
  ('SUP-006', 'Supplier 06', '083100000006', 'sup06@pos.local', 'Gudang F', 'CP 06'),
  ('SUP-007', 'Supplier 07', '083100000007', 'sup07@pos.local', 'Gudang G', 'CP 07'),
  ('SUP-008', 'Supplier 08', '083100000008', 'sup08@pos.local', 'Gudang H', 'CP 08'),
  ('SUP-009', 'Supplier 09', '083100000009', 'sup09@pos.local', 'Gudang I', 'CP 09'),
  ('SUP-010', 'Supplier 10', '083100000010', 'sup10@pos.local', 'Gudang J', 'CP 10')
on conflict (code) do nothing;

insert into public.product_units (name, symbol)
values
  ('Piece', 'pcs'),
  ('Box', 'box'),
  ('Pack', 'pack'),
  ('Bottle', 'btl'),
  ('Sachet', 'sct'),
  ('Kilogram', 'kg'),
  ('Gram', 'gr'),
  ('Liter', 'ltr'),
  ('Mililiter', 'ml'),
  ('Set', 'set')
on conflict do nothing;

insert into public.product_categories (code, name, is_active)
values
  ('CAT-001', 'Makanan', true),
  ('CAT-002', 'Minuman', true),
  ('CAT-003', 'Snack', true),
  ('CAT-004', 'Sembako', true),
  ('CAT-005', 'Frozen Food', true),
  ('CAT-006', 'Perawatan', true),
  ('CAT-007', 'Kebersihan', true),
  ('CAT-008', 'ATK', true),
  ('CAT-009', 'Elektronik Kecil', true),
  ('CAT-010', 'Lainnya', true)
on conflict (code) do nothing;

insert into public.products
  (sku, barcode, name, description, category_id, unit_id, buy_price, sell_price, min_stock, track_stock, is_active)
select
  seed.sku,
  seed.barcode,
  seed.name,
  seed.description,
  c.id,
  u.id,
  seed.buy_price,
  seed.sell_price,
  seed.min_stock,
  true,
  true
from (
  values
    ('PRD-SEED-001', '899000000001', 'Kopi Bubuk 100g', 'Produk dummy 1', 'CAT-002', 'pcs', 12000::numeric, 15000::numeric, 10::numeric),
    ('PRD-SEED-002', '899000000002', 'Teh Celup 25s', 'Produk dummy 2', 'CAT-002', 'box', 8000::numeric, 11000::numeric, 8::numeric),
    ('PRD-SEED-003', '899000000003', 'Biskuit Coklat', 'Produk dummy 3', 'CAT-003', 'pack', 6000::numeric, 8500::numeric, 12::numeric),
    ('PRD-SEED-004', '899000000004', 'Gula 1 Kg', 'Produk dummy 4', 'CAT-004', 'kg', 13000::numeric, 15500::numeric, 20::numeric),
    ('PRD-SEED-005', '899000000005', 'Susu UHT 1L', 'Produk dummy 5', 'CAT-002', 'ltr', 15000::numeric, 18500::numeric, 15::numeric),
    ('PRD-SEED-006', '899000000006', 'Mie Instan Goreng', 'Produk dummy 6', 'CAT-001', 'pcs', 2600::numeric, 3500::numeric, 30::numeric),
    ('PRD-SEED-007', '899000000007', 'Sabun Cair 450ml', 'Produk dummy 7', 'CAT-006', 'ml', 14000::numeric, 17500::numeric, 10::numeric),
    ('PRD-SEED-008', '899000000008', 'Tisu Kotak', 'Produk dummy 8', 'CAT-007', 'box', 9000::numeric, 12000::numeric, 15::numeric),
    ('PRD-SEED-009', '899000000009', 'Bolpoin Hitam', 'Produk dummy 9', 'CAT-008', 'pcs', 2000::numeric, 3500::numeric, 25::numeric),
    ('PRD-SEED-010', '899000000010', 'Baterai AA 2pcs', 'Produk dummy 10', 'CAT-009', 'pack', 7000::numeric, 9500::numeric, 18::numeric)
) as seed(sku, barcode, name, description, category_code, unit_symbol, buy_price, sell_price, min_stock)
join public.product_categories c on c.code = seed.category_code
join public.product_units u on u.symbol = seed.unit_symbol
on conflict (sku) do nothing;

insert into public.product_stocks (product_id, store_id, qty_on_hand)
select
  p.id,
  s.id,
  ((row_number() over (order by p.sku, s.code) * 7) % 55 + 5)::numeric
from public.products p
cross join (
  select id, code
  from public.stores
  where code in ('STR-001', 'STR-002')
) s
where p.sku like 'PRD-SEED-%'
on conflict (product_id, store_id) do update
set qty_on_hand = excluded.qty_on_hand,
    updated_at = now();

insert into public.cashier_shifts
  (store_id, cashier_id, opened_at, opening_cash, closed_at, closing_cash, expected_cash, cash_difference, status, note)
select
  s.id,
  u.id,
  now() - ((11 - n.rn) || ' hours')::interval,
  500000,
  now() - ((10 - n.rn) || ' hours')::interval,
  650000,
  640000,
  10000,
  'closed',
  format('SEED-SHIFT-%s', lpad(n.rn::text, 3, '0'))
from generate_series(1, 10) as n(rn)
join (
  select id, row_number() over (order by code) as rn
  from public.stores
  where code like 'STR-%'
) s on s.rn = n.rn
join (
  select id, row_number() over (order by email) as rn
  from public.users
  where email like 'seed.user%@pos.local'
) u on u.rn = n.rn
where not exists (
  select 1
  from public.cashier_shifts cs
  where cs.note = format('SEED-SHIFT-%s', lpad(n.rn::text, 3, '0'))
);

insert into public.sales
  (invoice_no, store_id, cashier_id, customer_id, shift_id, status, subtotal, discount_total, tax_total, service_total, grand_total, paid_total, change_total, note, sold_at)
select
  format('INV-SEED-%s', lpad(n.rn::text, 3, '0')),
  s.id,
  u.id,
  c.id,
  sh.id,
  'completed',
  50000 + (n.rn * 2500),
  0,
  0,
  0,
  50000 + (n.rn * 2500),
  50000 + (n.rn * 2500),
  0,
  'Seed sale transaction',
  now() - ((11 - n.rn) || ' days')::interval
from generate_series(1, 10) as n(rn)
join (
  select id, row_number() over (order by code) as rn
  from public.stores
  where code like 'STR-%'
) s on s.rn = n.rn
join (
  select id, row_number() over (order by email) as rn
  from public.users
  where email like 'seed.user%@pos.local'
) u on u.rn = n.rn
left join (
  select id, row_number() over (order by code) as rn
  from public.customers
  where code like 'CUST-%'
) c on c.rn = n.rn
left join (
  select id, row_number() over (order by note) as rn
  from public.cashier_shifts
  where note like 'SEED-SHIFT-%'
) sh on sh.rn = n.rn
on conflict (invoice_no) do nothing;

insert into public.sale_items
  (sale_id, product_id, product_name, sku_snapshot, qty, unit_price, discount_amount, tax_amount, subtotal, total)
select
  sa.id,
  p.id,
  p.name,
  p.sku,
  1 + (n.rn % 3),
  p.sell_price,
  0,
  0,
  (1 + (n.rn % 3)) * p.sell_price,
  (1 + (n.rn % 3)) * p.sell_price
from generate_series(1, 10) as n(rn)
join (
  select id, row_number() over (order by invoice_no) as rn
  from public.sales
  where invoice_no like 'INV-SEED-%'
) sa on sa.rn = n.rn
join (
  select id, name, sku, sell_price, row_number() over (order by sku) as rn
  from public.products
  where sku like 'PRD-SEED-%'
) p on p.rn = n.rn
where not exists (
  select 1 from public.sale_items si where si.sale_id = sa.id
);

insert into public.sale_payments (sale_id, payment_method, amount, reference_no, paid_at)
select
  sa.id,
  case when n.rn % 2 = 0 then 'qris' else 'cash' end,
  sa.grand_total,
  format('PAY-SEED-%s', lpad(n.rn::text, 3, '0')),
  sa.sold_at
from generate_series(1, 10) as n(rn)
join (
  select id, grand_total, sold_at, row_number() over (order by invoice_no) as rn
  from public.sales
  where invoice_no like 'INV-SEED-%'
) sa on sa.rn = n.rn
where not exists (
  select 1 from public.sale_payments sp where sp.sale_id = sa.id
);

insert into public.purchases
  (purchase_no, store_id, supplier_id, created_by, status, subtotal, discount_total, tax_total, grand_total, note, ordered_at, received_at)
select
  format('PUR-SEED-%s', lpad(n.rn::text, 3, '0')),
  s.id,
  sup.id,
  u.id,
  'received',
  80000 + (n.rn * 3000),
  0,
  0,
  80000 + (n.rn * 3000),
  'Seed purchase transaction',
  now() - ((30 - n.rn) || ' days')::interval,
  now() - ((29 - n.rn) || ' days')::interval
from generate_series(1, 10) as n(rn)
join (
  select id, row_number() over (order by code) as rn
  from public.stores
  where code like 'STR-%'
) s on s.rn = n.rn
join (
  select id, row_number() over (order by code) as rn
  from public.suppliers
  where code like 'SUP-%'
) sup on sup.rn = n.rn
join (
  select id, row_number() over (order by email) as rn
  from public.users
  where email like 'seed.user%@pos.local'
) u on u.rn = n.rn
on conflict (purchase_no) do nothing;

insert into public.purchase_items
  (purchase_id, product_id, product_name, qty, unit_cost, discount_amount, tax_amount, total)
select
  pu.id,
  p.id,
  p.name,
  2 + (n.rn % 5),
  p.buy_price,
  0,
  0,
  (2 + (n.rn % 5)) * p.buy_price
from generate_series(1, 10) as n(rn)
join (
  select id, row_number() over (order by purchase_no) as rn
  from public.purchases
  where purchase_no like 'PUR-SEED-%'
) pu on pu.rn = n.rn
join (
  select id, name, buy_price, row_number() over (order by sku) as rn
  from public.products
  where sku like 'PRD-SEED-%'
) p on p.rn = n.rn
where not exists (
  select 1 from public.purchase_items pi where pi.purchase_id = pu.id
);

insert into public.stock_movements
  (product_id, store_id, movement_type, qty, unit_cost, reference_type, reference_id, note, created_by)
select
  ps.product_id,
  ps.store_id,
  'opening',
  ps.qty_on_hand,
  p.buy_price,
  'seed_opening',
  ps.product_id,
  'Seed opening stock',
  u.id
from public.product_stocks ps
join public.products p on p.id = ps.product_id
left join (
  select id
  from public.users
  where email = 'seed.user01@pos.local'
  limit 1
) u on true
where not exists (
  select 1
  from public.stock_movements sm
  where sm.product_id = ps.product_id
    and sm.store_id = ps.store_id
    and sm.reference_type = 'seed_opening'
);

insert into public.cash_movements
  (store_id, shift_id, movement_type, amount, reason, reference_type, reference_id, created_by)
select
  sh.store_id,
  sh.id,
  case when n.rn % 2 = 0 then 'in' else 'out' end,
  10000 + (n.rn * 500),
  format('SEED-CASHFLOW-%s', lpad(n.rn::text, 3, '0')),
  'seed_cashflow',
  sh.id,
  sh.cashier_id
from generate_series(1, 10) as n(rn)
join (
  select id, store_id, cashier_id, row_number() over (order by note) as rn
  from public.cashier_shifts
  where note like 'SEED-SHIFT-%'
) sh on sh.rn = n.rn
where not exists (
  select 1
  from public.cash_movements cm
  where cm.reason = format('SEED-CASHFLOW-%s', lpad(n.rn::text, 3, '0'))
);

insert into public.expenses (store_id, category, description, amount, expense_date, paid_by)
select
  s.id,
  case when n.rn % 2 = 0 then 'Operasional' else 'Utilitas' end,
  format('Seed expense %s', lpad(n.rn::text, 3, '0')),
  15000 + (n.rn * 1000),
  current_date - (n.rn || ' days')::interval,
  u.id
from generate_series(1, 10) as n(rn)
join (
  select id, row_number() over (order by code) as rn
  from public.stores
  where code like 'STR-%'
) s on s.rn = n.rn
join (
  select id, row_number() over (order by email) as rn
  from public.users
  where email like 'seed.user%@pos.local'
) u on u.rn = n.rn
where not exists (
  select 1
  from public.expenses e
  where e.description = format('Seed expense %s', lpad(n.rn::text, 3, '0'))
);

insert into public.app_settings (key, value)
values
  ('company.name', '"POS Dummy Store"'::jsonb),
  ('company.phone', '"081200000001"'::jsonb),
  ('company.address', '"Jl. Merdeka No. 1"'::jsonb),
  ('invoice.prefix', '"INV"'::jsonb),
  ('purchase.prefix', '"PUR"'::jsonb),
  ('currency.code', '"IDR"'::jsonb),
  ('tax.default_percent', '11'::jsonb),
  ('service.default_percent', '5'::jsonb),
  ('stock.low_threshold_default', '10'::jsonb),
  ('receipt.footer', '"Terima kasih sudah berbelanja"'::jsonb)
on conflict (key) do update
set value = excluded.value,
    updated_at = now();

insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, before_data, after_data)
select
  u.id,
  'seed_init',
  'users',
  u.id,
  null,
  jsonb_build_object('email', u.email, 'name', u.name)
from (
  select id, email, name
  from public.users
  where email like 'seed.user%@pos.local'
  order by email
  limit 10
) u
where not exists (
  select 1 from public.audit_logs al where al.action = 'seed_init' and al.entity_type = 'users'
);

