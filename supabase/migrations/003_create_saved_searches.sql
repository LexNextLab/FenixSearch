-- Saved searches table
create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  search_type text not null,
  params jsonb default '{}',
  created_at timestamptz default now() not null
);

create index idx_saved_searches_user_id on public.saved_searches (user_id);

alter table public.saved_searches enable row level security;

create policy "Users can manage own saved searches"
  on public.saved_searches for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
