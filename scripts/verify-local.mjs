// End-to-end verification of the CRO-4 auth + billing scaffolding against the
// local Supabase stack and a running `next dev` server. It proves the issue's
// success condition without needing live Stripe credentials:
//
//   1. A user can SIGN UP and immediately gets a session.
//   2. A profile row is auto-provisioned by the DB trigger.
//   3. The user can LOG IN and gets a session.
//   4. A Stripe subscription webhook updates `public.subscriptions`...
//   5. ...and the change is visible to the user through RLS.
//
// Run with: node scripts/verify-local.mjs   (requires `supabase start` + `next dev`)

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const email = `verify+${Date.now()}@example.com`;
const password = "supersecret123";
const customerId = `cus_verify_${Date.now()}`;
const subscriptionId = `sub_verify_${Date.now()}`;

function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    process.exit(1);
  }
  console.log(`✓ ${msg}`);
}

const anon = createClient(SUPABASE_URL, ANON_KEY);
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 1. Sign up.
const signUp = await anon.auth.signUp({ email, password });
assert(!signUp.error, `Sign up succeeds (${email})`);
assert(signUp.data.session?.access_token, "Sign up returns an active session");
const userId = signUp.data.user.id;

// 2. Profile auto-provisioned by trigger.
const profile = await admin.from("profiles").select("id, email").eq("id", userId).maybeSingle();
assert(!profile.error && profile.data, "Profile row auto-created by trigger");
assert(profile.data.email === email, "Profile email matches the signed-up user");

// 3. Log in (fresh client → no carried session).
const fresh = createClient(SUPABASE_URL, ANON_KEY);
const signIn = await fresh.auth.signInWithPassword({ email, password });
assert(!signIn.error && signIn.data.session?.access_token, "Log in returns an active session");

// Link a Stripe customer to the profile (what getOrCreateStripeCustomer does).
const link = await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
assert(!link.error, "Stripe customer id linked to profile");

// 4. Simulate a Stripe subscription webhook hitting the running app.
const now = Math.floor(Date.now() / 1000);
const event = {
  id: `evt_${Date.now()}`,
  object: "event",
  type: "customer.subscription.created",
  data: {
    object: {
      id: subscriptionId,
      object: "subscription",
      customer: customerId,
      status: "active",
      cancel_at_period_end: false,
      items: {
        object: "list",
        data: [
          {
            id: "si_verify",
            object: "subscription_item",
            quantity: 1,
            price: { id: "price_verify", object: "price" },
            current_period_start: now,
            current_period_end: now + 30 * 24 * 60 * 60,
          },
        ],
      },
    },
  },
};

const payload = JSON.stringify(event);
const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });

const res = await fetch(`${APP_URL}/api/stripe/webhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "stripe-signature": header },
  body: payload,
});
assert(res.status === 200, `Webhook accepted (HTTP ${res.status})`);

// 5. Subscription is reflected in the DB and visible to the user via RLS.
const viaRls = await signIn.data.session
  ? await fresh.from("subscriptions").select("id, status, price_id").eq("id", subscriptionId).maybeSingle()
  : null;
assert(viaRls && !viaRls.error && viaRls.data, "Subscription row visible to the user (RLS)");
assert(viaRls.data.status === "active", `Subscription status reflected as '${viaRls.data.status}'`);

// RLS sanity: a different anonymous user must NOT see this subscription.
const stranger = createClient(SUPABASE_URL, ANON_KEY);
const leak = await stranger.from("subscriptions").select("id").eq("id", subscriptionId).maybeSingle();
assert(!leak.data, "Subscription is NOT visible without the owner's session (RLS enforced)");

// Cleanup.
await admin.from("subscriptions").delete().eq("id", subscriptionId);
await admin.auth.admin.deleteUser(userId);

console.log("\nAll checks passed — sign up, login, session, and webhook→DB subscription sync work.");
