import "server-only";

import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function toIso(unixSeconds: number | null | undefined): string | null {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}

function customerIdOf(customer: string | Stripe.Customer | Stripe.DeletedCustomer): string {
  return typeof customer === "string" ? customer : customer.id;
}

/**
 * Return the Stripe customer id for a user, creating the customer (and saving
 * its id on the user's profile) on first use. This keeps a stable 1:1 mapping
 * between our users and Stripe customers.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string | undefined,
): Promise<string> {
  const admin = createSupabaseAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  const customer = await getStripe().customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  await admin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  return customer.id;
}

/**
 * Write the authoritative state of a Stripe subscription into our database.
 * Called from the webhook (and after checkout) so `public.subscriptions` always
 * mirrors Stripe. Uses the service-role client because it runs outside any user
 * session and must bypass RLS.
 */
export async function upsertSubscriptionRecord(
  subscription: Stripe.Subscription,
): Promise<void> {
  const admin = createSupabaseAdminClient();
  const customerId = customerIdOf(subscription.customer);

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!profile) {
    throw new Error(`No profile found for Stripe customer ${customerId}`);
  }

  // In current Stripe API versions the billing-period fields live on the
  // subscription item rather than the subscription itself.
  const item = subscription.items.data[0];

  const { error } = await admin.from("subscriptions").upsert({
    id: subscription.id,
    user_id: profile.id,
    status: subscription.status,
    price_id: item?.price.id ?? null,
    quantity: item?.quantity ?? null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_start: toIso(item?.current_period_start),
    current_period_end: toIso(item?.current_period_end),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to upsert subscription ${subscription.id}: ${error.message}`);
  }
}

/** Fetch a subscription from Stripe by id and sync it to the database. */
export async function syncSubscriptionById(subscriptionId: string): Promise<void> {
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  await upsertSubscriptionRecord(subscription);
}
