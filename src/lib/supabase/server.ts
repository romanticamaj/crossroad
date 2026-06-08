import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";

/**
 * Supabase client for use in Server Components, Server Actions, and Route
 * Handlers. It reads and writes the auth session through Next's cookie store so
 * a logged-in user is recognised across requests.
 *
 * Always call `supabase.auth.getUser()` (not `getSession()`) on the server when
 * you need a trustworthy identity — `getUser()` revalidates the token with the
 * Supabase Auth server, whereas `getSession()` trusts the (spoofable) cookie.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // `setAll` is called from Server Components in some flows, where setting
        // cookies throws. That's safe to ignore here because session refresh is
        // handled centrally in proxy.ts (which runs before rendering).
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // No-op: see comment above.
        }
      },
    },
  });
}
