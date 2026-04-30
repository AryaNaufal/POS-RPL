create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_password_reset_tokens_user_id
  on public.password_reset_tokens (user_id);

create index if not exists idx_password_reset_tokens_expires_at
  on public.password_reset_tokens (expires_at);

create unique index if not exists idx_password_reset_tokens_token_hash
  on public.password_reset_tokens (token_hash);
