-- Run this in your Supabase project → SQL Editor

-- =============================================
-- 1. Availability slots
-- =============================================
create table if not exists availability_slots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  is_booked boolean not null default false,
  created_at timestamptz default now(),
  unique(date, start_time, end_time)
);

-- Allow public reads (clients see available slots)
alter table availability_slots enable row level security;
create policy "Public can read availability" on availability_slots
  for select using (true);

-- Only authenticated users (admin) can insert/update/delete
create policy "Admin can manage availability" on availability_slots
  for all using (auth.role() = 'authenticated');

-- =============================================
-- 2. Booking requests
-- =============================================
create table if not exists booking_requests (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid references availability_slots(id) on delete set null,
  client_name text not null,
  client_email text not null,
  client_phone text default '',
  service_type text not null check (service_type in ('private', 'kids', 'offPiste', 'group')),
  duration text not null check (duration in ('3h', '4h', 'halfDay', 'fullDay')),
  message text default '',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz default now()
);

-- Clients can insert booking requests (anonymous ok)
alter table booking_requests enable row level security;
create policy "Anyone can create a booking request" on booking_requests
  for insert with check (true);

-- Only admin can read/update
create policy "Admin can manage bookings" on booking_requests
  for all using (auth.role() = 'authenticated');

-- =============================================
-- 3. Reviews (optional — admin-curated)
-- =============================================
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_name text not null,
  rating smallint check (rating between 1 and 5),
  text text not null,
  approved boolean not null default false,
  created_at timestamptz default now()
);

alter table reviews enable row level security;
create policy "Public can read approved reviews" on reviews
  for select using (approved = true);
create policy "Admin can manage reviews" on reviews
  for all using (auth.role() = 'authenticated');

-- =============================================
-- 4. Reviews — image upload support
-- =============================================
alter table reviews add column if not exists image_url text;

-- Allow anonymous clients to submit a review (defense in depth —
-- the POST /api/reviews route already writes via the service role key)
create policy "Anyone can create a review" on reviews
  for insert with check (true);

-- Public bucket for review images (public bucket => objects are served
-- via public URL without needing a storage.objects SELECT policy)
insert into storage.buckets (id, name, public)
values ('reviews', 'reviews', true)
on conflict (id) do nothing;

-- Only admin can delete/replace review images (cleanup on review deletion)
create policy "Admin can manage review images" on storage.objects
  for all using (bucket_id = 'reviews' and auth.role() = 'authenticated');

-- =============================================
-- 5. Availability — allow overlapping time-slot presets on the same day
-- (e.g. "Full Day" 09:00-16:00 together with "09:00-12:00", both starting
-- at the same start_time but with different end_time)
-- =============================================
alter table availability_slots drop constraint if exists availability_slots_date_start_time_key;
alter table availability_slots add constraint availability_slots_date_start_time_end_time_key
  unique (date, start_time, end_time);

-- =============================================
-- 6. Remove "group" as a valid service type
-- (Group Lesson was discontinued — confirmed via SELECT that zero
-- booking_requests rows use service_type = 'group' before running this)
-- =============================================
alter table booking_requests drop constraint if exists booking_requests_service_type_check;
alter table booking_requests add constraint booking_requests_service_type_check
  check (service_type in ('private', 'kids', 'offPiste'));

-- =============================================
-- 7. Multi-day bookings: one request, several days, each with its
-- own duration (derived from the linked slot's start/end time) — plus
-- a resort/location field, chosen once for the whole booking.
-- =============================================

-- Links one booking request to every day (slot) the client picked.
-- "slot_id" on booking_requests is kept for backward compatibility
-- with existing single-day rows and stores the first day as a quick
-- reference; the full list of days always lives here.
create table if not exists booking_request_slots (
  booking_request_id uuid references booking_requests(id) on delete cascade,
  slot_id uuid references availability_slots(id) on delete cascade,
  primary key (booking_request_id, slot_id)
);

alter table booking_request_slots enable row level security;
create policy "Anyone can create booking_request_slots" on booking_request_slots
  for insert with check (true);
create policy "Admin can manage booking_request_slots" on booking_request_slots
  for all using (auth.role() = 'authenticated');

-- "duration" described a single booking's length; now that each day
-- in a multi-day booking can have its own duration, it's no longer
-- meaningful at the booking level. Made optional, not removed —
-- existing rows keep their value.
alter table booking_requests alter column duration drop not null;

-- Resort/location — chosen once per booking, not per day.
alter table booking_requests add column if not exists resort text
  check (resort in ('Hakuba', 'Myoko', 'Shiga Kogen', 'Other'));
alter table booking_requests add column if not exists resort_other text default '';

-- =============================================
-- 8. Invert the availability model: open by default, blocked on demand.
-- Every date in the season now offers both franjas unless it appears
-- here (blocked by Florencia) or already has a confirmed booking.
-- =============================================
create table if not exists blocked_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  note text default '',
  created_at timestamptz default now()
);

alter table blocked_dates enable row level security;
create policy "Public can read blocked dates" on blocked_dates
  for select using (true);
create policy "Admin can manage blocked dates" on blocked_dates
  for all using (auth.role() = 'authenticated');

-- =============================================
-- Notes
-- =============================================
-- After running this SQL:
-- 1. Go to Authentication → Users → Create a new user
-- 2. Use Floriseg@proton.me and set a password
-- 3. This will be Florencia's admin login
