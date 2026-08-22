-- Haven Operations Simulator - isolated end-to-end staging records.
-- SAFETY: Apply only to simulator project gyircetinwdefxfeutma.

create table if not exists public.simulation_issues (
  id uuid primary key default gen_random_uuid(),
  simulation_run_id uuid not null,
  correlation_id uuid not null unique,
  scenario_id text not null,
  scenario_version text not null,
  hotel_id text not null check (hotel_id ~ '^sim-hotel-[0-9]+$'),
  guest_id text not null check (guest_id ~ '^sim-guest-'),
  room_number text not null,
  description text not null check (char_length(description) between 1 and 2000),
  department text not null,
  urgency text not null check (urgency in ('low','medium','high','critical')),
  ai_urgency_raw text not null check (ai_urgency_raw in ('low','medium','high','critical')),
  urgency_rule_triggered text,
  status text not null default 'open' check (status in ('open','in_progress','resolved')),
  resolution_verified boolean not null default false,
  resolution_summary text,
  mind_reading jsonb not null default '{}'::jsonb,
  synthetic boolean not null default true check (synthetic is true),
  created_at timestamptz not null default now(),
  simulated_at timestamptz not null,
  resolved_at timestamptz
);

create table if not exists public.simulation_memory_index (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null unique references public.simulation_issues(id) on delete cascade,
  simulation_run_id uuid not null,
  guest_id text not null,
  room_number text not null,
  department text not null,
  status text not null,
  context_snapshot jsonb not null,
  synthetic boolean not null default true check (synthetic is true),
  indexed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.simulation_pattern_alerts (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.simulation_issues(id) on delete cascade,
  simulation_run_id uuid not null,
  alert_type text not null,
  severity text not null check (severity in ('medium','high','critical')),
  threshold integer not null,
  observed_count integer not null,
  detail text not null,
  synthetic boolean not null default true check (synthetic is true),
  fired_at timestamptz not null default now()
);

create table if not exists public.simulation_shift_handoffs (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.simulation_issues(id) on delete cascade,
  simulation_run_id uuid not null,
  packet jsonb not null,
  synthetic boolean not null default true check (synthetic is true),
  generated_at timestamptz not null default now()
);

create index if not exists simulation_issues_run_idx on public.simulation_issues(simulation_run_id);
create index if not exists simulation_issues_hotel_status_idx on public.simulation_issues(hotel_id, status);
create index if not exists simulation_memory_guest_idx on public.simulation_memory_index(guest_id);
create index if not exists simulation_alerts_run_idx on public.simulation_pattern_alerts(simulation_run_id);
create index if not exists simulation_handoffs_run_idx on public.simulation_shift_handoffs(simulation_run_id);

alter table public.simulation_issues enable row level security;
alter table public.simulation_memory_index enable row level security;
alter table public.simulation_pattern_alerts enable row level security;
alter table public.simulation_shift_handoffs enable row level security;

-- No client policies: service-role Pages Functions are the only data boundary.
revoke all on public.simulation_issues from anon, authenticated;
revoke all on public.simulation_memory_index from anon, authenticated;
revoke all on public.simulation_pattern_alerts from anon, authenticated;
revoke all on public.simulation_shift_handoffs from anon, authenticated;

comment on table public.simulation_issues is 'Synthetic-only operational staging records; never production guest data.';
