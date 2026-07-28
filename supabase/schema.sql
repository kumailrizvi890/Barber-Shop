-- Fade Kings Barber Shop (Lynnwood) — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push`) on a fresh project.

create extension if not exists "pgcrypto";

-- ── profiles ─────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer','barber','owner')),
  name text not null,
  email text,
  phone text,
  location text,
  bio text,
  initials text not null default '',
  rating numeric not null default 5.0,
  cuts_done integer not null default 0,
  -- Barber signups start 'pending' until the owner approves them (only then
  -- do they show up in the customer-facing crew). Customers/owners are
  -- created 'approved' since the workflow doesn't apply to them.
  status text not null default 'approved' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "profiles are readable by any authenticated user"
  on profiles for select to authenticated using (true);
create policy "users can insert their own profile"
  on profiles for insert to authenticated with check (auth.uid() = id);
create policy "users can update their own profile"
  on profiles for update to authenticated using (auth.uid() = id);
create policy "owners can update any profile"
  on profiles for update to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner'));
create policy "public can read barber profiles"
  on profiles for select to anon using (role = 'barber' and status = 'approved');

-- The self-update policy above only checks `auth.uid() = id`, not which
-- columns change — without this trigger, any logged-in user could set their
-- own `role`/`status` and self-promote. auth.uid() is null outside of the
-- PostgREST/app request context (SQL editor, migrations, dashboard) — that's
-- already trusted access, so it's left unrestricted (bootstraps the first
-- owner account).
create or replace function prevent_self_role_escalation() returns trigger
language plpgsql as $$
begin
  if (new.role is distinct from old.role or new.status is distinct from old.status) then
    if auth.uid() is not null and not exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'owner'
    ) then
      raise exception 'Only an owner can change role or status.';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role_status
  before update on profiles
  for each row execute function prevent_self_role_escalation();

-- ── barber_services ──────────────────────────────────────────────────────
create table if not exists barber_services (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  price numeric not null,
  created_at timestamptz not null default now()
);

alter table barber_services enable row level security;
create policy "services are readable by any authenticated user"
  on barber_services for select to authenticated using (true);
create policy "barbers manage their own services"
  on barber_services for all to authenticated
  using (auth.uid() = barber_id) with check (auth.uid() = barber_id);
create policy "public can read barber services"
  on barber_services for select to anon using (true);

-- ── availability ─────────────────────────────────────────────────────────
create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references profiles(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  slot_index integer not null check (slot_index between 0 and 8),
  blocked boolean not null default false,
  unique (barber_id, weekday, slot_index)
);

alter table availability enable row level security;
create policy "availability is readable by any authenticated user"
  on availability for select to authenticated using (true);
create policy "barbers manage their own availability"
  on availability for all to authenticated
  using (auth.uid() = barber_id) with check (auth.uid() = barber_id);
create policy "public can read availability"
  on availability for select to anon using (true);

-- ── bookings ─────────────────────────────────────────────────────────────
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  barber_id uuid not null references profiles(id) on delete cascade,
  service_id uuid references barber_services(id) on delete set null,
  service_name text not null,
  price numeric not null,
  date date not null,
  time text not null,
  status text not null default 'pending' check (status in ('pending','approved','declined','completed')),
  rating integer check (rating between 1 and 5),
  reminder_sent boolean not null default false,
  created_at timestamptz not null default now()
);

alter table bookings enable row level security;
create policy "customers can read their own bookings"
  on bookings for select to authenticated using (auth.uid() = customer_id or auth.uid() = barber_id);
create policy "customers can create bookings"
  on bookings for insert to authenticated with check (auth.uid() = customer_id);
create policy "customers and barbers can update relevant bookings"
  on bookings for update to authenticated
  using (auth.uid() = customer_id or auth.uid() = barber_id);
create policy "owners can read all bookings"
  on bookings for select to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner'));

-- ── posts (My Work grid) ────────────────────────────────────────────────
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references profiles(id) on delete cascade,
  media_url text not null,
  type text not null check (type in ('image','video')),
  created_at timestamptz not null default now()
);

alter table posts enable row level security;
create policy "posts are readable by any authenticated user"
  on posts for select to authenticated using (true);
create policy "barbers manage their own posts"
  on posts for all to authenticated
  using (auth.uid() = barber_id) with check (auth.uid() = barber_id);
create policy "public can read posts"
  on posts for select to anon using (true);

-- ── post_likes ───────────────────────────────────────────────────────────
create table if not exists post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

alter table post_likes enable row level security;
create policy "likes are publicly readable"
  on post_likes for select to anon, authenticated using (true);
create policy "users manage their own likes"
  on post_likes for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── post_comments ────────────────────────────────────────────────────────
create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  text text not null,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

alter table post_comments enable row level security;
create policy "visible comments are publicly readable"
  on post_comments for select to anon, authenticated using (hidden = false);
create policy "barbers can read all comments on their own posts"
  on post_comments for select to authenticated
  using (auth.uid() = (select barber_id from posts where posts.id = post_comments.post_id));
create policy "users can add comments"
  on post_comments for insert to authenticated with check (auth.uid() = user_id);
create policy "barbers can hide comments on their own posts"
  on post_comments for update to authenticated
  using (auth.uid() = (select barber_id from posts where posts.id = post_comments.post_id));

-- ── notifications ────────────────────────────────────────────────────────
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  text text not null,
  icon text not null default 'bell',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;
create policy "users read their own notifications"
  on notifications for select to authenticated using (auth.uid() = user_id);
create policy "any authenticated user can notify another user"
  on notifications for insert to authenticated with check (true);
create policy "users mark their own notifications read"
  on notifications for update to authenticated using (auth.uid() = user_id);

-- ── rewards ──────────────────────────────────────────────────────────────
create table if not exists rewards (
  user_id uuid primary key references profiles(id) on delete cascade,
  points integer not null default 0
);

alter table rewards enable row level security;
create policy "users read their own rewards"
  on rewards for select to authenticated using (auth.uid() = user_id);
create policy "users manage their own rewards"
  on rewards for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Barbers can read/write any customer's points: needed both to credit a
-- completed cut and to deduct points when confirming a QR redemption.
-- (A narrower per-booking-relationship policy here caused an unrelated
-- permissive UPDATE policy on this table to stop matching at all when
-- combined — keep this as a single broad policy, not two overlapping ones.)
create policy "barbers can manage any customer points"
  on rewards for all to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'barber'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'barber'));

-- ── reward_redemptions (QR-code free-cut redemption) ────────────────────
create table if not exists reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  points integer not null,
  status text not null default 'pending' check (status in ('pending','used')),
  created_at timestamptz not null default now(),
  used_at timestamptz,
  used_by uuid references profiles(id)
);

alter table reward_redemptions enable row level security;
create policy "users can view their own redemptions"
  on reward_redemptions for select to authenticated using (auth.uid() = user_id);
create policy "users can create their own redemptions"
  on reward_redemptions for insert to authenticated with check (auth.uid() = user_id);
create policy "barbers can view any redemption"
  on reward_redemptions for select to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'barber'));
create policy "barbers can confirm redemptions"
  on reward_redemptions for update to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'barber'));

-- ── storage: barber "My Work" photos/videos ─────────────────────────────
insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do nothing;

create policy "public read access to post media"
  on storage.objects for select using (bucket_id = 'posts');
create policy "barbers upload their own post media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "barbers delete their own post media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── site_stats: public live "bookings made" counter ─────────────────────
-- Individual bookings stay locked down by RLS (customers/barbers only see
-- their own). This table exposes just a running total so the landing page
-- can show a live counter without leaking booking details to anon visitors.
create table if not exists site_stats (
  key text primary key,
  value bigint not null default 0
);

alter table site_stats enable row level security;
create policy "anyone can read site stats"
  on site_stats for select to anon, authenticated using (true);

insert into site_stats (key, value) values ('total_bookings', 0)
on conflict (key) do nothing;

create or replace function bump_total_bookings() returns trigger
language plpgsql security definer as $$
begin
  update site_stats set value = value + 1 where key = 'total_bookings';
  return new;
end;
$$;

create trigger bookings_bump_total_bookings
  after insert on bookings
  for each row execute function bump_total_bookings();

alter publication supabase_realtime add table site_stats;
