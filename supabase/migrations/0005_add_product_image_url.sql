alter table public.products
  add column if not exists image_url text not null default 'https://placehold.co/600x400';

update public.products
set image_url = 'https://placehold.co/600x400'
where image_url is null or btrim(image_url) = '';
