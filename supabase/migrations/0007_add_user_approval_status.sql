alter table public.users
  add column if not exists approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected')),
  add column if not exists approved_at timestamp with time zone,
  add column if not exists approved_by uuid references public.users(id) on delete set null,
  add column if not exists approval_note text;

create index if not exists idx_users_approval_status on public.users (approval_status);

update public.users u
set
  approval_status = 'approved',
  approved_at = coalesce(u.approved_at, now())
where
  approval_status = 'pending'
  and exists (
    select 1
    from public.user_store_roles usr
    where usr.user_id = u.id
      and usr.is_active = true
  );
