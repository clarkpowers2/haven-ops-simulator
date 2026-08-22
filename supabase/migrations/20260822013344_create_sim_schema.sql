-- =============================================================
-- Haven Operations Simulator™ — Supabase Schema
-- HCCGSA LLC | ARCHITEK N ADVOCACY™
-- Author: Nathaniel Clarke | ORCID: 0009-0005-5311-1358
-- Version: 1.0.0 | August 2026
--
-- IMPORTANT: This schema runs in the SIMULATOR Supabase project only.
-- Never run this against the production Haven Supabase project.
-- All records carry synthetic = true as a defense-in-depth guard.
-- =============================================================
-- Enable UUID generation
create extension if not exists "pgcrypto";
-- =============================================================
-- SIM SCHEMA
-- =============================================================
create schema if not exists sim;
-- =============================================================
-- sim.hotels
-- Fictional boutique hotel properties used in simulator runs
-- =============================================================
create table sim.hotels (
id 	uuid primary key default gen_random_uuid(),
name 	text not null,
room_count 	integer not null check (room_count between 20 and 150),
property_type text not null default 'boutique',
timezone 	text not null default 'America/New_York',
city 	text,
floors 	integer not null default 5,
star_rating 	integer check (star_rating between 1 and 5),
synthetic 	boolean not null default true,
created_at 	timestamptz not null default now()
);
-- =============================================================
-- sim.rooms
-- Individual rooms within a sim hotel
-- =============================================================
create table sim.rooms (
id 	uuid primary key default gen_random_uuid(),
hotel_id 	uuid not null references sim.hotels(id) on delete cascade,
room_number 	text not null,
floor 	integer not null,
room_type 	text not null check (room_type in
('standard','deluxe','suite','accessible')),


status 	text not null default 'available' check (status in
('available','occupied','out_of_order','maintenance')),
synthetic 	boolean not null default true,
created_at 	timestamptz not null default now()
);
-- =============================================================
-- sim.guests
-- Generated guest profiles and stay state
-- =============================================================
create table sim.guests (
id 	uuid primary key default gen_random_uuid(),
hotel_id 	uuid not null references sim.hotels(id) on delete cascade,
stay_id 	uuid not null default gen_random_uuid(),
room_id 	uuid references sim.rooms(id),
first_name 	text not null,
last_name 	text not null,
segment 	text not null check (segment in (
'business_traveler','leisure','family','repeat_guest',
'event_attendee','vip','accessibility_needs'
)),
check_in_date 	date not null,
check_out_date 	date not null,
stay_night 	integer not null default 1,
patience_minutes 	integer not null default 10,
time_sensitivity 	text check (time_sensitivity in
('low','medium','high','critical')),
sentiment_baseline 	text not null default 'neutral' check (sentiment_baseline in
('positive','neutral','negative')),
prior_failures 	integer not null default 0,
state 	text not null default 'neutral' check (state in (
'neutral','friction_observed','concern_expressed',
'complaint_submitted','awaiting_acknowledgement',
'awaiting_resolution','recovered','frustrated',
'escalated','checked_out','post_stay'
)),
profile_json 	jsonb,
synthetic 	boolean not null default true,
created_at 	timestamptz not null default now()
);
-- =============================================================
-- sim.staff
-- Operational staffing for each simulator run
-- =============================================================
create table sim.staff (
id 	uuid primary key default gen_random_uuid(),
hotel_id 	uuid not null references sim.hotels(id) on delete cascade,
name 	text not null,
role 	text not null check (role in (
'front_desk','engineering','housekeeping',


'fb','security','manager'
)),
department 	text not null,
shift_start 	time not null,
shift_end 	time not null,
avg_response_minutes 	integer not null default 8,
concurrent_capacity 	integer not null default 3,
authority_limit_usd 	numeric(10,2) not null default 0,
escalation_authority 	boolean not null default false,
quality_profile 	text not null default 'average' check (quality_profile in
('strong','average','overloaded')),
available 	boolean not null default true,
synthetic 	boolean not null default true,
created_at 	timestamptz not null default now()
);
-- =============================================================
-- sim.scenarios
-- Version-controlled test cases — authored by human reviewers
-- =============================================================
create table sim.scenarios (
id 	uuid primary key default gen_random_uuid(),
scenario_code text not null unique, -- e.g. ENG-001
version 	text not null default '1.0.0',
title 	text not null,
category 	text not null check (category in (
'front_desk','housekeeping','engineering',
'food_beverage','safety_security','shift_handoff','adversarial'
)),
setup_json 	jsonb not null, -- hotel, guest, staffing conditions
expected_json jsonb not null, -- expected routing, SLAs, prohibited actions
scoring_json 	jsonb not null, -- metric weights for this scenario
active 	boolean not null default true,
created_at 	timestamptz not null default now(),
updated_at 	timestamptz not null default now()
);
-- =============================================================
-- sim.runs
-- One reproducible execution of a scenario or batch
-- =============================================================
create table sim.runs (
id 	uuid primary key default gen_random_uuid(),
scenario_id 	uuid references sim.scenarios(id),
scenario_version 	text,
seed 	bigint not null,
mode 	text not null check (mode in ('baseline','haven')),
hotel_id 	uuid references sim.hotels(id),
occupancy_rate 	numeric(4,2),
staffing_condition text check (staffing_condition in
('normal','reduced','overloaded')),


status 	text not null default 'pending' check (status in (
'pending','running','passed','failed','error','needs_review'
)),
final_score 	numeric(5,2),
critical_safety_failures integer not null default 0,
started_at 	timestamptz,
ended_at 	timestamptz,
notes 	text,
created_at 	timestamptz not null default now()
);
-- =============================================================
-- sim.events
-- Chronological event log for every run
-- =============================================================
create table sim.events (
id 	uuid primary key default gen_random_uuid(),
run_id 	uuid not null references sim.runs(id) on delete cascade,
sequence 	integer not null,
event_type 	text not null check (event_type in (
'guest_check_in','guest_message','issue_created',
'ai_analysis_completed','route_recommended','route_accepted',
'staff_acknowledgement','department_dispatch','staff_shift_end',
'shift_handoff','guest_followup','manager_escalation',
'work_completed','guest_confirmation','guest_checkout',
'post_stay_outcome','safety_flag','pattern_alert'
)),
actor 	text, 	-- 'guest','staff','manager','ai','system'
simulated_at 	timestamptz not null,
payload_json 	jsonb,
created_at 	timestamptz not null default now()
);
-- =============================================================
-- sim.decisions
-- Captures every AI, workflow, and staff decision
-- =============================================================
create table sim.decisions (
id 	uuid primary key default gen_random_uuid(),
run_id 	uuid not null references sim.runs(id) on delete cascade,
correlation_id uuid not null default gen_random_uuid(),
actor 	text not null check (actor in
('ai','staff','manager','workflow','system')),
decision_type text not null check (decision_type in (
'routing','urgency_classification','response_suggestion',
'escalation','handoff','refusal','override','resolution'
)),
input_ref 	uuid, 	-- references sim.events.id
input_hash 	text, 	-- sha256 of input content
output_json 	jsonb not null,
output_hash 	text, 	-- sha256 of output content


model_name 	text,
prompt_version text,
latency_ms 	integer,
human_override boolean not null default false,
override_reason text,
simulated_at 	timestamptz not null,
created_at 	timestamptz not null default now()
);
-- =============================================================
-- sim.scorecards
-- Evaluation results per metric per run
-- =============================================================
create table sim.scorecards (
id 	uuid primary key default gen_random_uuid(),
run_id 	uuid not null references sim.runs(id) on delete cascade,
metric_name 	text not null check (metric_name in (
'capture_rate','routing_accuracy','acknowledgement_sla',
'context_retention','duplicate_explanation_rate',
'escalation_rate','resolution_validity',
'unsafe_output_rate','manager_override_rate',
'pattern_alert_precision','weighted_run_score'
)),
actual 	numeric(6,4),
expected 	numeric(6,4),
pass 	boolean,
weight 	numeric(4,2),
notes 	text,
created_at 	timestamptz not null default now()
);
-- =============================================================
-- sim.review_queue
-- Human review of unsafe, ambiguous, or failed outputs
-- =============================================================
create table sim.review_queue (
id 	uuid primary key default gen_random_uuid(),
run_id 	uuid not null references sim.runs(id) on delete cascade,
decision_id 	uuid references sim.decisions(id),
risk_level 	text not null check (risk_level in
('low','medium','high','critical')),
failure_type 	text check (failure_type in (
'wrong_routing','wrong_urgency','hallucination',
'unauthorized_commitment','privacy_violation',
'safety_failure','bias_detected','prompt_injection',
'sla_miss','context_lost','invalid_closure'
)),
reviewer 	text,
disposition 	text check (disposition in
('pass','fail','needs_fix','rubric_revision')),
reviewer_notes text,


reviewed_at 	timestamptz,
created_at 	timestamptz not null default now()
);
-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
alter table sim.hotels 	enable row level security;
alter table sim.rooms 	enable row level security;
alter table sim.guests 	enable row level security;
alter table sim.staff 	enable row level security;
alter table sim.scenarios 	enable row level security;
alter table sim.runs 	enable row level security;
alter table sim.events 	enable row level security;
alter table sim.decisions 	enable row level security;
alter table sim.scorecards 	enable row level security;
alter table sim.review_queue enable row level security;
-- Service role has full access (used by simulator orchestrator only)
create policy "service_role_full_access" on sim.hotels 	for all using (auth.role()
= 'service_role');
create policy "service_role_full_access" on sim.rooms 	for all using (auth.role()
= 'service_role');
create policy "service_role_full_access" on sim.guests 	for all using (auth.role()
= 'service_role');
create policy "service_role_full_access" on sim.staff 	for all using (auth.role()
= 'service_role');
create policy "service_role_full_access" on sim.scenarios 	for all using (auth.role()
= 'service_role');
create policy "service_role_full_access" on sim.runs 	for all using (auth.role()
= 'service_role');
create policy "service_role_full_access" on sim.events 	for all using (auth.role()
= 'service_role');
create policy "service_role_full_access" on sim.decisions 	for all using (auth.role()
= 'service_role');
create policy "service_role_full_access" on sim.scorecards 	for all using (auth.role()
= 'service_role');
create policy "service_role_full_access" on sim.review_queue for all using (auth.role()


= 'service_role');
-- Anon and authenticated roles get NO access to sim schema
-- Admin dashboard reads use service role via server-side only
-- =============================================================
-- INDEXES for performance
-- =============================================================
create index idx_sim_events_run_id 	on sim.events(run_id);
create index idx_sim_events_type 	on sim.events(event_type);
create index idx_sim_decisions_run_id on sim.decisions(run_id);
create index idx_sim_scorecards_run on sim.scorecards(run_id);
create index idx_sim_runs_scenario 	on sim.runs(scenario_id);
create index idx_sim_review_risk 	on sim.review_queue(risk_level);

