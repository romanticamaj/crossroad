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

Source lives under `src/app` (App Router). The home route is `src/app/page.tsx`.

## CI

`.github/workflows/ci.yml` runs on every push and pull request to any branch:

1. `npm ci` — reproducible install from the lockfile
2. `npm run lint` — ESLint
3. `npm run build` — production build (also type-checks)

Green CI on `main` is a release gate.

## Deployment

**Target (M0.1): GitHub Pages** via `.github/workflows/deploy.yml` on push to
`main`. The app is exported as a fully static site (`output: "export"` in
`next.config.ts`) into `./out`, then published with the official
`actions/configure-pages` → `actions/upload-pages-artifact` → `actions/deploy-pages`
pipeline.

Live URL: **https://romanticamaj.github.io/crossroad/**

### Why GitHub Pages (and not Vercel/Fly/Render yet)

The M0.1 success condition is "a deployed public URL serves the app, and CI is
green." GitHub Pages is the cheapest path that meets it:

- **$0 and no new account/billing.** Vercel/Render free tiers are non-commercial;
  using them for a revenue product implies a paid tier — a spend decision we don't
  need to make to ship a foundation.
- **Fully self-serve.** Everything runs through the GitHub account we already
  control. No external OAuth handoff that could block automation.

### This is a reversible decision (not a one-way door)

GitHub Pages serves static files only. The moment we need server-side rendering or
API routes — waitlist capture (CRO-3), auth + database + billing (CRO-4), and
LLM changelog generation (CRO-5) — we migrate the **deploy target** to a server
platform (Vercel / Fly / Render). The Next.js codebase does not change; we drop
`output: "export"` and point the deploy workflow at the new host. CRO-4 is the
natural point to make that hosting call, since it introduces the first backend.

## Local development

```bash
npm install
npm run dev      # http://localhost:3000 (no basePath locally)
npm run lint
npm run build    # static export to ./out
```

`NEXT_PUBLIC_BASE_PATH` is set only by the deploy workflow (to `/crossroad`) so the
project-site base path applies in production but never locally.
