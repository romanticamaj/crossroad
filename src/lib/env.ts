// Centralised, validated access to environment variables.
//
// Every value is exposed through a lazy getter, so importing this module never
// throws — a missing variable only surfaces an error when the value is actually
// used (at request time), which keeps `next build` working in environments that
// don't have secrets configured.
//
// NEXT_PUBLIC_* values are inlined into the client bundle by Next at build time
// and are safe to expose to the browser. The other values are server-only
// secrets; Next strips non-public `process.env` references from client bundles,
// and these getters are only ever invoked from server code.

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  // --- Public (browser-safe) ---
  get NEXT_PUBLIC_SUPABASE_URL(): string {
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY(): string {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  /** Public origin used to build Stripe redirect URLs. Defaults to localhost. */
  get NEXT_PUBLIC_SITE_URL(): string {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  },

  // --- Server-only secrets ---
  get SUPABASE_SERVICE_ROLE_KEY(): string {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get STRIPE_SECRET_KEY(): string {
    return required("STRIPE_SECRET_KEY");
  },
  get STRIPE_WEBHOOK_SECRET(): string {
    return required("STRIPE_WEBHOOK_SECRET");
  },
  /** The Stripe Price id of the placeholder subscription plan. */
  get STRIPE_PRICE_ID(): string {
    return required("STRIPE_PRICE_ID");
  },
};
