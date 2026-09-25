-- Support CRM database schema
-- Run this in the Supabase SQL Editor for a new project

create sequence ticket_seq;

create table tickets (
  id bigint generated always as identity primary key,
  ticket_id text unique not null
    default 'TKT-' || lpad(nextval('ticket_seq')::text, 3, '0'),
  customer_name text not null,
  customer_email text not null,
  subject text not null,
  description text not null,
  status text not null default 'Open'
    check (status in ('Open', 'In Progress', 'Closed')),
  priority text not null default 'Medium'
    check (priority in ('Low', 'Medium', 'High', 'Urgent')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table notes (
  id bigint generated always as identity primary key,
  ticket_id text not null references tickets(ticket_id) on delete cascade,
  note_text text not null,
  created_at timestamptz default now()
);

-- Row Level Security: open access for this MVP demo.
-- A production version would restrict writes to authenticated support agents.
alter table tickets enable row level security;
alter table notes enable row level security;

create policy "public access" on tickets for all using (true) with check (true);
create policy "public access" on notes for all using (true) with check (true);