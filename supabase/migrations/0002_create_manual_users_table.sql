create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamp with time zone not null default now()
);

alter table public.users enable row level security;

drop policy if exists "Users can self-register." on public.users;
create policy "Users can self-register." on public.users
  for insert
  with check (true);
