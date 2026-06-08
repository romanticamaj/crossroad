import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";

import { env } from "@/lib/env";
import { syncSubscriptionById, upsertSubscriptionRecord } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";

// Stripe webhook endpoint. Stripe calls this (not a logged-in user) whenever
// subscription state changes, so it authenticates by verifying the signature
// against STRIPE_WEBHOOK_SECRET — never by a user session.
//
// We must read the *raw* request body for signature verification, so this
// handler intentionally does not parse JSON itself.
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Invalid signature: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && typeof session.subscription === "string") {
          await syncSubscriptionById(session.subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await upsertSubscriptionRecord(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        // Ignore other event types — we only mirror subscription lifecycle.
        break;
    }
  } catch (err) {
    // Return 500 so Stripe retries with backoff rather than dropping the event.
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook handler failed for ${event.type}:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
