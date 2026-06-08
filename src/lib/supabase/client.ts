import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";

/**
 * Supabase client for use in Client Components (browser). Uses the publishable
 * (anon) key, which is safe to ship to the browser — row-level security on the
 * database governs what it can actually read or write.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
