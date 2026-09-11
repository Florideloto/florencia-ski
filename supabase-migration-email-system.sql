-- ============================================================
-- Email notification system: client language + visible failure log
-- Run this in Supabase → SQL Editor → New query → Run
-- Safe to run more than once (idempotent).
-- ============================================================

alter table booking_requests add column if not exists locale text not null default 'es'
  check (locale in ('en', 'es', 'th'));

create table if not exists email_logs (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('booking_notification', 'booking_confirmation')),
  booking_request_id uuid references booking_requests(id) on delete set null,
  recipient text not null,
  status text not null check (status in ('sent', 'failed')),
  error_message text,
  created_at timestamptz default now()
);

alter table email_logs enable row level security;

drop policy if exists "Admin can read email logs" on email_logs;
create policy "Admin can read email logs" on email_logs
  for select using (auth.role() = 'authenticated');

-- Tell PostgREST to pick up the new table/column immediately
notify pgrst, 'reload schema';
