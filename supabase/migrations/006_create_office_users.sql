-- Office users (from CSV import) - linked to auth when activated
create table if not exists public.office_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users (id) on delete set null,
  name text not null,
  email text unique not null,
  department text,
  avatar_url text,
  role text default 'user',
  is_active boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_office_users_email on public.office_users (email);
create index idx_office_users_auth_user_id on public.office_users (auth_user_id);

alter table public.office_users enable row level security;

-- Only admins can manage (we'll check in API via service role)
-- Regular users can read their own office_user record
create policy "Users can view own office_user"
  on public.office_users for select
  using (auth.uid() = auth_user_id);
