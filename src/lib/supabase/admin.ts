import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

/**
 * Privileged Supabase client that uses the service-role (secret) key and so
 * BYPASSES row-level security. It must only ever run on the server — never in a
 * Client Component or anything shipped to the browser.
 *
 * We use it in exactly one place: the Stripe webhook handler, which is an
 * unauthenticated endpoint (the request comes from Stripe, not a logged-in
 * user) and needs to write authoritative subscription state into the database.
 */
export function createSupabaseAdminClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
