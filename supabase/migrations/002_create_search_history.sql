-- Search history table
create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  search_type text not null,
  params jsonb default '{}',
  result_count int default 0,
  cost decimal(10, 4) default 0,
  cost_formatted text,
  success boolean default true,
  error_code text,
  created_at timestamptz default now() not null
);

create index idx_search_history_user_id on public.search_history (user_id);
create index idx_search_history_created_at on public.search_history (created_at desc);
create index idx_search_history_search_type on public.search_history (search_type);
create index idx_search_history_user_created on public.search_history (user_id, created_at desc);

alter table public.search_history enable row level security;

create policy "Users can insert own search history"
  on public.search_history for insert
  with check (auth.uid() = user_id);

create policy "Users can view own search history"
  on public.search_history for select
  using (auth.uid() = user_id);
