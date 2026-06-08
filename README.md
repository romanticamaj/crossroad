# Crossroad

Changelogs that write themselves. Crossroad connects to a repository and turns
merged work into a polished, public changelog — automatically.

This repo is the product codebase. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the
stack and deployment decisions.

- **Live:** https://romanticamaj.github.io/crossroad/
- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4
- **CI:** GitHub Actions — install + lint + build on every push/PR
- **Deploy:** GitHub Actions → GitHub Pages (static export) on `main`

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

## Scripts

| Command         | Description                                   |
| --------------- | --------------------------------------------- |
| `npm run dev`   | Start the local dev server                    |
| `npm run lint`  | Run ESLint                                     |
| `npm run build` | Production build → static export in `./out`   |

## Status

- **M0.1** foundation: repo, app skeleton, CI, and live deploy. ✅
- **M0.2** landing page + email waitlist + privacy-respecting analytics.
  Persisted to Supabase (insert-only RLS) from the static client; see
  [ARCHITECTURE.md](./ARCHITECTURE.md#waitlist--analytics-store-m02).

Auth, billing, and the changelog MVP follow in subsequent milestones.

### Environment

The waitlist/analytics client reads these public build-time vars (set as GitHub
Actions secrets for the deploy; absent locally → form degrades gracefully):

| Var | Purpose |
| --- | ------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
