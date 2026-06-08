import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Opens the Stripe Customer Portal so a subscriber can manage or cancel their
// (test-mode) subscription. Redirects the browser to Stripe's hosted portal.
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", env.NEXT_PUBLIC_SITE_URL), 303);
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.stripe_customer_id) {
    return NextResponse.redirect(
      new URL("/dashboard", env.NEXT_PUBLIC_SITE_URL),
      303,
    );
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${env.NEXT_PUBLIC_SITE_URL}/dashboard`,
  });

  return NextResponse.redirect(session.url, 303);
}
