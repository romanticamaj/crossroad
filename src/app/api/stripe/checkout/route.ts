import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { getOrCreateStripeCustomer } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Starts a Stripe Checkout session for the placeholder subscription plan and
// redirects the browser to Stripe's hosted checkout. The dashboard posts a form
// here. No charge happens in test mode — use Stripe's test cards.
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", env.NEXT_PUBLIC_SITE_URL), 303);
  }

  const customerId = await getOrCreateStripeCustomer(user.id, user.email);

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${env.NEXT_PUBLIC_SITE_URL}/dashboard?checkout=success`,
    cancel_url: `${env.NEXT_PUBLIC_SITE_URL}/dashboard?checkout=cancelled`,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Could not create checkout session." }, { status: 500 });
  }

  return NextResponse.redirect(session.url, 303);
}
