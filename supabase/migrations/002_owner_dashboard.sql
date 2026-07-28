-- Fade Kings — Owner Dashboard
-- Adds an 'owner' role, a barber-approval workflow, and a public live
-- booking counter. Run once against the existing project in the Supabase
-- SQL editor (safe to re-run — every step is idempotent).

-- ── profiles: allow role = 'owner' ──────────────────────────────────────
do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table profiles drop constraint %I', con.conname);
  end loop;
end $$;

alter table profiles add constraint profiles_role_check
  check (role in ('customer','barber','owner'));

-- ── profiles: barber approval status ────────────────────────────────────
-- Defaults to 'approved' so every existing row (all current customers and
-- barbers) keeps working exactly as before. New barber signups explicitly
-- insert status = 'pending' from the app; the owner then approves/rejects.
alter table profiles add column if not exists status text not null default 'approved'
  check (status in ('pending','approved','rejected'));

-- Owners can approve/reject applications (update someone else's profile).
-- Profiles are already readable by any authenticated user, so no new
-- select policy is needed for the owner to see pending barbers.
drop policy if exists "owners can update any profile" on profiles;
create policy "owners can update any profile"
  on profiles for update to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner'));

-- Anonymous crew browsing should only ever surface approved barbers.
drop policy if exists "public can read barber profiles" on profiles;
create policy "public can read barber profiles"
  on profiles for select to anon using (role = 'barber' and status = 'approved');

-- The existing self-update policy only checks `auth.uid() = id`, not which
-- columns change — as written, any logged-in user could set their own
-- `role`/`status` (e.g. update({role:'owner'})) and self-promote. Guard the
-- two sensitive columns with a trigger so only an owner can ever change
-- them, regardless of which RLS policy let the UPDATE through.
-- auth.uid() is null outside of the PostgREST/app request context (SQL
-- editor, migrations, the dashboard) — that's already trusted, privileged
-- access, so it's left unrestricted (this is how you bootstrap the very
-- first owner account).
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

drop trigger if exists profiles_guard_role_status on profiles;
create trigger profiles_guard_role_status
  before update on profiles
  for each row execute function prevent_self_role_escalation();

-- ── bookings: owners can read every booking (for stats/revenue) ────────
drop policy if exists "owners can read all bookings" on bookings;
create policy "owners can read all bookings"
  on bookings for select to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner'));

-- ── site_stats: a single public counter, kept in sync by trigger ───────
-- Individual bookings stay locked down by RLS (customers/barbers only see
-- their own). This table exposes just a running total so the landing page
-- can show a live "bookings made" counter without leaking booking details.
create table if not exists site_stats (
  key text primary key,
  value bigint not null default 0
);

alter table site_stats enable row level security;
drop policy if exists "anyone can read site stats" on site_stats;
create policy "anyone can read site stats"
  on site_stats for select to anon, authenticated using (true);

insert into site_stats (key, value)
values ('total_bookings', (select count(*) from bookings))
on conflict (key) do update set value = excluded.value;

create or replace function bump_total_bookings() returns trigger
language plpgsql security definer as $$
begin
  update site_stats set value = value + 1 where key = 'total_bookings';
  return new;
end;
$$;

drop trigger if exists bookings_bump_total_bookings on bookings;
create trigger bookings_bump_total_bookings
  after insert on bookings
  for each row execute function bump_total_bookings();

-- Turn on Realtime change events for the counter row. If this errors with
-- "relation is already member of publication", it's already on — ignore.
alter publication supabase_realtime add table site_stats;
