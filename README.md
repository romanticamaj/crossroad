# Crossroad

Changelogs that write themselves. Crossroad connects to a repository and turns
merged work into a polished, public changelog — automatically.

This repo is the product codebase. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the
stack and deployment decisions.

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres + Auth) · Stripe
- **CI:** GitHub Actions — install + lint + build on every push/PR
- **Deploy:** server platform, TBD (see [ARCHITECTURE.md](./ARCHITECTURE.md) → Deployment)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

The landing page renders without any backend. Auth and billing need the local
setup below.

## Local setup (auth + database + billing)

You need [Docker](https://docs.docker.com/get-docker/) and the
[Supabase CLI](https://supabase.com/docs/guides/cli)
(`brew install supabase/tap/supabase`).

### 1. Start the database + auth (Supabase)

```bash
supabase start          # boots local Postgres + Auth in Docker, applies migrations
supabase status -o env  # prints API_URL, PUBLISHABLE_KEY (anon), SECRET_KEY (service role)
```

> This repo's `supabase/config.toml` uses non-default ports (`553xx`) so the
> stack can run alongside other local Supabase projects.

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill `.env.local` from what `supabase status -o env` printed:

| Variable                        | From `supabase status` |
| ------------------------------- | ---------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `API_URL`              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `PUBLISHABLE_KEY`      |
| `SUPABASE_SERVICE_ROLE_KEY`     | `SECRET_KEY`           |

### 3. Configure Stripe (test mode)

1. In the [Stripe dashboard](https://dashboard.stripe.com) (test mode), create a
   recurring **Product + Price**. Put the price id (`price_…`) in `STRIPE_PRICE_ID`.
2. Copy your **test secret key** (`sk_test_…`) into `STRIPE_SECRET_KEY`.
3. Forward webhooks and copy the printed signing secret (`whsec_…`) into
   `STRIPE_WEBHOOK_SECRET`:

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

### 4. Run it

```bash
npm run dev   # http://localhost:3000
```

Sign up at `/signup`, open `/dashboard`, click **Subscribe**, and pay with
Stripe's test card `4242 4242 4242 4242` (any future expiry / CVC). The webhook
updates `public.subscriptions` and the dashboard shows the active status. **No
real charges occur in test mode.**

### Verify the whole flow automatically

With `supabase start` and `npm run dev` running, this proves sign up → session →
profile trigger → login → webhook → subscription (RLS-scoped), end to end, using
a locally-signed Stripe event (no live Stripe needed):

```bash
node --env-file=.env.local scripts/verify-local.mjs
```

## Scripts

| Command         | Description                            |
| --------------- | -------------------------------------- |
| `npm run dev`   | Start the local dev server             |
| `npm run lint`  | Run ESLint                             |
| `npm run build` | Production (server) build + type-check |

## Status

- **M0.1** — repo, app skeleton, CI. ✅
- **M0.2** — landing page + waitlist + privacy-respecting analytics (Supabase,
  insert-only RLS); see
  [ARCHITECTURE.md](./ARCHITECTURE.md#waitlist--analytics-store-m02). In progress (CRO-3).
- **M0.3** — auth + database + Stripe billing scaffolding. ✅ verified locally;
  production hosting + live test keys pending (CRO-4).

All environment variables are documented in [`.env.example`](./.env.example).
