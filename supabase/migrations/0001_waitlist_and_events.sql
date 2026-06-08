-- CRO-3 / M0.2 — waitlist capture + privacy-respecting analytics.
--
-- The landing page is a fully static export served from GitHub Pages, so it
-- writes directly to Supabase from the browser using the public anon key.
-- Security model: anon may INSERT only. It can never SELECT/UPDATE/DELETE, so
-- the email list and analytics are write-only from the client and readable only
-- with the service role (server side / dashboard).

-- ---------------------------------------------------------------------------
-- Waitlist signups
-- ---------------------------------------------------------------------------
create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  created_at  timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- Anonymous visitors may add themselves to the waitlist, nothing else.
drop policy if exists "waitlist anon insert" on public.waitlist;
create policy "waitlist anon insert"
  on public.waitlist
  for insert
  to anon
  with check (true);

-- ---------------------------------------------------------------------------
-- Privacy-respecting analytics events (page views + signups)
-- ---------------------------------------------------------------------------
-- No cookies, no fingerprints, no PII. We store a coarse event type, the path,
-- and (optionally) the referrer host only.
create table if not exists public.events (
  id             uuid primary key default gen_random_uuid(),
  type           text not null check (type in ('page_view', 'signup')),
  path           text not null,
  referrer_host  text,
  created_at     timestamptz not null default now()
);

alter table public.events enable row level security;

drop policy if exists "events anon insert" on public.events;
create policy "events anon insert"
  on public.events
  for insert
  to anon
  with check (true);

create index if not exists events_type_created_at_idx
  on public.events (type, created_at);
