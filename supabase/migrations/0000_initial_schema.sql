-- Create a table for public profiles
create table notes (
  id uuid not null default gen_random_uuid(),
  title text not null,
  created_at timestamp with time zone not null default now(),

  primary key (id)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security
alter table notes enable row level security;

create policy "Public notes are viewable by everyone." on notes
  for select using (true);

create policy "Users can insert their own notes." on notes
  for insert with check (true);
