// Thin client for our Supabase REST backend.
//
// Why a hand-rolled fetch wrapper instead of `@supabase/supabase-js`?
// M0.2 ships as a *fully static* export (GitHub Pages, no server). All we need
// from the client is two unauthenticated inserts: a waitlist signup and a
// privacy-respecting page-view event. The Supabase anon key is designed to be
// public and embedded in client code; combined with insert-only Row Level
// Security policies (see `supabase/migrations`), the browser can safely write
// but never read. A ~40-line wrapper keeps the static bundle tiny and avoids a
// dependency we don't otherwise need yet. CRO-4 (auth + billing) is the natural
// point to adopt the full SDK.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Whether the store is wired up. Until the Supabase project exists and its URL
 * + anon key are injected at build time (via GitHub Actions secrets), the UI
 * degrades gracefully instead of throwing — the page still deploys and renders.
 */
export const storeConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

async function insert(table: string, row: Record<string, unknown>): Promise<void> {
  if (!storeConfigured) {
    throw new Error("store-not-configured");
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      // We never read the row back, so ask PostgREST not to return it.
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`store-insert-failed:${res.status}:${detail.slice(0, 200)}`);
  }
}

/** Add an email to the waitlist. Duplicate emails are treated as success. */
export async function joinWaitlist(email: string): Promise<void> {
  try {
    await insert("waitlist", { email });
  } catch (err) {
    // A unique-violation on email means "already signed up" — a success from the
    // visitor's point of view. PostgREST returns 409 for that.
    if (err instanceof Error && err.message.includes("store-insert-failed:409")) {
      return;
    }
    throw err;
  }
}

/**
 * Record a privacy-respecting analytics event. We store only a coarse event
 * type, the path, and (optionally) the referrer host — no cookies, no
 * fingerprinting, no PII. Best-effort: failures never surface to the visitor.
 */
export async function recordEvent(
  type: "page_view" | "signup",
  path: string,
  referrerHost?: string,
): Promise<void> {
  if (!storeConfigured) return;
  try {
    await insert("events", { type, path, referrer_host: referrerHost ?? null });
  } catch {
    // Analytics must never break the page.
  }
}
