import "server-only";

import Stripe from "stripe";

import { env } from "@/lib/env";

let cached: Stripe | null = null;

/**
 * Lazily-constructed Stripe client (server-only). We don't pass an explicit
 * `apiVersion` so the SDK uses the version it was published against, which keeps
 * the pinned types and runtime in sync.
 */
export function getStripe(): Stripe {
  if (!cached) {
    cached = new Stripe(env.STRIPE_SECRET_KEY, { typescript: true });
  }
  return cached;
}
