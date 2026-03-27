-- Leads/CRM table - one lead per company per user (dados cadastrais da empresa)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cnpj text not null,
  razao_social text,
  nome_fantasia text,
  situacao_cadastral text,
  endereco text,
  bairro text,
  municipio text,
  uf text,
  cep text,
  telefones jsonb default '[]',
  emails jsonb default '[]',
  capital_social numeric,
  segmento text,
  porte text,
  natureza_juridica text,
  data_inicio_atividade text,
  cnae_principal text,
  sites jsonb default '[]',
  socios jsonb default '[]',
  notas text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id, cnpj)
);

create index idx_leads_user_id on public.leads (user_id);
create index idx_leads_cnpj on public.leads (cnpj);
create index idx_leads_razao_social on public.leads (razao_social);

alter table public.leads enable row level security;

create policy "Users can manage own leads"
  on public.leads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
