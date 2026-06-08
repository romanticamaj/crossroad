-- Auth + billing foundation (CRO-4).
--
-- Two tables in the public schema:
--   profiles      — 1:1 with auth.users; holds the Stripe customer id.
--   subscriptions — a mirror of Stripe subscription state, kept in sync by the
--                   Stripe webhook handler (which writes with the service role).
--
-- RLS is enabled on both. Users can read their own rows. Nobody but the service
-- role (used only server-side by the webhook) may write to subscriptions, so a
-- signed-in user can never forge or tamper with their billing state.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  email              text,
  stripe_customer_id text unique,
  created_at         timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
-- Mirrors Stripe's subscription.status values.
create type public.subscription_status as enum (
  'trialing',
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'unpaid',
  'paused'
);

create table public.subscriptions (
  id                   text primary key,            -- Stripe subscription id (sub_...)
  user_id              uuid not null references auth.users (id) on delete cascade,
  status               public.subscription_status not null,
  price_id             text,                         -- Stripe price id of the plan
  quantity             integer,
  cancel_at_period_end boolean not null default false,
  current_period_start timestamptz,
  current_period_end   timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);

alter table public.subscriptions enable row level security;

create policy "Users can view their own subscriptions"
  on public.subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Intentionally no insert/update/delete policies: only the service role
-- (the Stripe webhook) writes here, and the service role bypasses RLS.

-- ---------------------------------------------------------------------------
-- Auto-provision a profile row whenever a new auth user is created.
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

-- Defense in depth: this is only ever invoked by the trigger below, so revoke
-- the implicit PUBLIC execute grant that Postgres adds to every new function.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
