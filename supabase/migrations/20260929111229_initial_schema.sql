-- BLAGO CRM initial schema
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company_name text not null,
  contact_name text,
  phone text,
  whatsapp text,
  language text not null default 'EN' check (language in ('HE','EN','RU')),
  status text not null default 'new' check (status in ('new','no_answer','not_interested','whatsapp_sent','callback','interested','custom')),
  custom_status text,
  next_action_at timestamptz,
  notes text,
  last_contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.call_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  outcome text not null,
  note text,
  called_at timestamptz not null default now(),
  next_action_at timestamptz
);
alter table public.companies enable row level security;
alter table public.call_logs enable row level security;
grant select, insert, update, delete on public.companies to authenticated;
grant select, insert, update, delete on public.call_logs to authenticated;
create policy "companies own rows" on public.companies for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "call logs own rows" on public.call_logs for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);