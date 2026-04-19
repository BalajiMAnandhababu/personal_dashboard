-- Command Dashboard — Initial Schema
-- Run this in your Supabase SQL Editor

-- ─── Extensions ────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Companies ─────────────────────────────────────────────────────────────
create table if not exists companies (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  color      text not null,
  created_at timestamp with time zone default now()
);

-- ─── People ────────────────────────────────────────────────────────────────
create table if not exists people (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  initials     text not null,
  avatar_color text not null,
  company_ids  uuid[] default '{}',
  is_active    boolean not null default true,
  created_at   timestamp with time zone default now()
);

-- ─── Tasks ─────────────────────────────────────────────────────────────────
create table if not exists tasks (
  id                 uuid primary key default uuid_generate_v4(),
  title              text not null,
  description        text,
  company_id         uuid references companies(id) on delete set null,
  assigned_to        uuid references people(id) on delete set null,
  parent_task_id     uuid references tasks(id) on delete cascade,
  linked_task_ids    uuid[] default '{}',
  category           text check (category in ('strategy', 'operations', 'follow-up', 'development')),
  priority_quadrant  int  check (priority_quadrant between 1 and 4),
  status             text not null default 'todo' check (status in ('todo', 'inprogress', 'done', 'blocked')),
  due_date           date,
  estimated_hours    decimal(6, 2),
  actual_hours       decimal(6, 2),
  ai_suggested       boolean not null default false,
  created_at         timestamp with time zone default now(),
  updated_at         timestamp with time zone default now()
);

-- ─── Time Logs ─────────────────────────────────────────────────────────────
create table if not exists time_logs (
  id               uuid primary key default uuid_generate_v4(),
  task_id          uuid not null references tasks(id) on delete cascade,
  started_at       timestamp with time zone not null,
  ended_at         timestamp with time zone,
  duration_minutes int,
  notes            text
);

-- ─── Task History ──────────────────────────────────────────────────────────
create table if not exists task_history (
  id            uuid primary key default uuid_generate_v4(),
  task_id       uuid not null references tasks(id) on delete cascade,
  changed_by    text not null,
  field_changed text not null,
  old_value     text,
  new_value     text,
  changed_at    timestamp with time zone default now()
);

-- ─── Indexes ───────────────────────────────────────────────────────────────
create index if not exists idx_tasks_company_id        on tasks(company_id);
create index if not exists idx_tasks_assigned_to       on tasks(assigned_to);
create index if not exists idx_tasks_status            on tasks(status);
create index if not exists idx_tasks_priority_quadrant on tasks(priority_quadrant);
create index if not exists idx_tasks_parent_task_id    on tasks(parent_task_id);
create index if not exists idx_tasks_due_date          on tasks(due_date);
create index if not exists idx_time_logs_task_id       on time_logs(task_id);
create index if not exists idx_task_history_task_id    on task_history(task_id);

-- ─── updated_at trigger ────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on tasks
  for each row execute procedure set_updated_at();

-- ─── Row Level Security ────────────────────────────────────────────────────
alter table companies    enable row level security;
alter table people       enable row level security;
alter table tasks        enable row level security;
alter table time_logs    enable row level security;
alter table task_history enable row level security;

-- Allow all operations from service role (backend uses service key)
-- and authenticated users (future auth support)
create policy "Service role full access" on companies
  using (true) with check (true);
create policy "Service role full access" on people
  using (true) with check (true);
create policy "Service role full access" on tasks
  using (true) with check (true);
create policy "Service role full access" on time_logs
  using (true) with check (true);
create policy "Service role full access" on task_history
  using (true) with check (true);

-- ─── Supabase Real-time ────────────────────────────────────────────────────
-- Enable real-time replication so the client can subscribe to live changes
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table people;

-- ─── Seed: Companies ───────────────────────────────────────────────────────
insert into companies (name, color) values
  ('Unified Paygate', '#185FA5'),
  ('Thangapanam Gold', '#854F0B'),
  ('Iraivi',          '#0F6E56'),
  ('Digitus360',      '#993C1D'),
  ('Infinex',         '#534AB7'),
  ('Personal',        '#888780')
on conflict do nothing;
