# Architecture

This document records the foundational technical decisions for **Crossroad** and
why they were made. Keep it current as the stack evolves.

## Product

Crossroad connects to a code repository and turns merged work into a polished,
public changelog automatically (LLM-generated). Revenue model is subscription.

## Stack (M0.1)

| Concern        | Choice                          | Why |
| -------------- | ------------------------------- | --- |
| Framework      | **Next.js 16 (App Router)**     | Boring, ubiquitous, great DX. Same framework scales from static marketing pages to SSR app + API routes for auth/billing/LLM work later. |
| Language       | **TypeScript**                  | Type safety, standard for the ecosystem. |
| Styling        | **Tailwind CSS v4**             | Fast, consistent UI without bikeshedding; easy for the upcoming landing page (CRO-3). |
| Linting        | **ESLint** (`eslint-config-next`) | Catches issues in CI. |
| Package manager | **npm**                        | Default, zero extra tooling; `npm ci` in CI is reproducible. |
| Database + Auth | **Supabase** (managed Postgres) | One managed service gives us Postgres + email/password auth + RLS. Lean: no separate auth service to run. Adopted in M0.2 (waitlist) and extended in M0.3. |
| Auth client    | **`@supabase/ssr`**             | Cookie-based sessions that work across Server Components, Server Actions, and Route Handlers in the App Router. |
| Billing        | **Stripe** (test mode)          | Industry standard. Hosted Checkout + Customer Portal means we don't handle card data; webhooks keep our DB in sync. |
| Validation     | **Zod**                         | Small, typed runtime validation for form input. |

Source lives under `src/app` (App Router). The home route is `src/app/page.tsx`.

## Auth, database & billing (M0.3 — CRO-4)

The first server-side features live here. This is also why the app moved from a
static export to a server runtime (see Deployment).

**Database** — two tables added in `supabase/migrations` (alongside M0.2's
`waitlist`/`events`):

- `profiles` — one row per `auth.users` row (auto-created by a trigger on
  signup). Holds the user's `stripe_customer_id`.
- `subscriptions` — a mirror of Stripe subscription state (status, price,
  period, cancel-at-period-end).

Both have **Row Level Security** on: a user can read only their own rows.
`subscriptions` has *no* write policy for users — only the service role (the
webhook) writes it, so billing state can't be forged from the client.

**Auth** — Supabase email/password.

- `src/lib/supabase/{server,client,admin}.ts` — three clients: server
  (cookie session), browser (publishable key), and admin (service-role,
  webhook-only, bypasses RLS).
- `src/app/actions/auth.ts` — `signup` / `login` / `logout` Server Actions.
- `src/proxy.ts` — Next 16's renamed middleware. Refreshes the session on every
  request and does optimistic redirects (guards `/dashboard`, bounces logged-in
  users off `/login` and `/signup`).

**Billing** — Stripe subscriptions, test mode.

- `POST /api/stripe/checkout` → Stripe Checkout for the placeholder plan.
- `POST /api/stripe/portal` → Stripe Customer Portal (manage/cancel).
- `POST /api/stripe/webhook` → verifies the Stripe signature and upserts
  subscription state into the DB. This is what makes the DB reflect reality.

**Secrets** — all config is via environment variables (`.env.example`
documents them). Nothing secret is committed; `.env.local` is gitignored.

**Verification** — `scripts/verify-local.mjs` proves the full flow against the
local Supabase stack + a running dev server: sign up → session → profile
trigger → login → webhook → subscription row visible via RLS.

## Waitlist + analytics store (M0.2)

The landing page (CRO-3) needs to **persist waitlist emails** and **record page
views** — but M0.1 deploys a *fully static* site to GitHub Pages, which has no
server or API routes. Rather than migrate hosting early (the architecture defers
that to CRO-4), M0.2 writes directly from the browser to **Supabase**:

| Concern | Choice | Why |
| ------- | ------ | --- |
| Store | **Supabase (Postgres)** | $0 free tier, browser-callable REST, and it becomes the CRO-4 backend (auth + DB + billing). One coherent backend instead of a throwaway. |
| Client access | **anon key + insert-only RLS** | The anon key is public-by-design. Row Level Security lets the browser `INSERT` into `waitlist`/`events` but never `SELECT` — the list is write-only from the client, readable only via the service role/dashboard. |
| Analytics | **first-party events table** | Privacy-respecting: no cookies, no fingerprinting, no third-party tracker, no PII. We store event type, path, and a coarse referrer host only. Page views + signups in one place. |
| Client lib | **hand-rolled `fetch` wrapper** (`src/lib/store.ts`) | Two unauthenticated inserts don't justify a dependency on a static bundle. CRO-4 adopts `@supabase/supabase-js` when auth arrives. |

Schema + policies live in `supabase/migrations/0001_waitlist_and_events.sql`.
The client reads `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
injected at build time by the deploy workflow from GitHub Actions secrets. When
those are absent (local dev, PRs, or before the project is provisioned) the page
still builds and deploys; the waitlist form degrades gracefully.

This is reversible: it does not commit us to a host, and it advances CRO-4.

## CI

`.github/workflows/ci.yml` runs on every push and pull request to any branch:

1. `npm ci` — reproducible install from the lockfile
2. `npm run lint` — ESLint
3. `npm run build` — production build (also type-checks)

Green CI on `main` is a release gate.

## Deployment

**M0.1–M0.2 (retired): GitHub Pages static export.** Through the landing page,
the app was a fully static export (`output: "export"`) published to GitHub Pages.

**M0.3 onward: a server runtime is required.** Auth, the database session, and
the Stripe webhook are server-side — a static export literally can't build them
(`next build` no longer emits `./out`). As `ARCHITECTURE` always anticipated,
CRO-4 is the point where the **deploy target** moves from GitHub Pages to a
server platform. The Next.js code is host-agnostic; only the host changes.

The GitHub Pages workflow has therefore been removed. **Choosing the new host is
a CEO call** because it involves an external account and a (small) spend
decision — see the CRO-4 escalation.

> **Recommendation: Vercel.** First-class Next.js support, generates a public
> URL, env-var/secret management built in, and a $0 hobby tier is enough for
> test-mode validation. Fly/Render are fine alternatives if we prefer a generic
> container host. Whichever we pick, the env vars in `.env.example` are set as
> deployment secrets and the app runs unchanged.

CI (`ci.yml`) still builds on every push and remains the release gate.

## Local development

```bash
npm install
supabase start                 # local Postgres + Auth (Docker); prints keys
cp .env.example .env.local     # fill in the supabase + stripe values
npm run dev                    # http://localhost:3000
npm run lint
npm run build                  # production (server) build
```

See the README "Local setup" section for the full auth + Stripe walkthrough,
including how to run `scripts/verify-local.mjs`.
