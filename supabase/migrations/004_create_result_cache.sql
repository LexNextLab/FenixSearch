-- Result cache table (no RLS - accessed via service role only)
create table if not exists public.result_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text unique not null,
  search_type text not null,
  params jsonb default '{}',
  result jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz default now() not null
);

create unique index idx_result_cache_key on public.result_cache (cache_key);
create index idx_result_cache_expires on public.result_cache (expires_at);

-- No RLS - service role has full access, anon/authenticated have none
alter table public.result_cache enable row level security;

create policy "No direct access for users"
  on public.result_cache for all
  using (false)
  with check (false);
