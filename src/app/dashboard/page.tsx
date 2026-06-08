import { redirect } from "next/navigation";

import { logout } from "@/app/actions/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard · Crossroad" };

// Active-ish statuses that mean the user currently has access.
const ACTIVE_STATUSES = new Set(["trialing", "active"]);

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts already guards this route, but re-check close to the data.
  if (!user) {
    redirect("/login");
  }

  const { checkout } = await searchParams;

  // RLS ensures this only ever returns the current user's own subscription.
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, price_id, current_period_end, cancel_at_period_end")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isActive = subscription ? ACTIVE_STATUSES.has(subscription.status) : false;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-6 py-16">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-gray-500 underline hover:text-gray-900"
          >
            Log out
          </button>
        </form>
      </header>

      <section className="space-y-1">
        <p className="text-sm text-gray-500">Signed in as</p>
        <p className="font-medium">{user.email}</p>
      </section>

      {checkout === "success" ? (
        <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
          Checkout complete — your subscription is being activated.
        </p>
      ) : null}
      {checkout === "cancelled" ? (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Checkout cancelled. You can subscribe whenever you’re ready.
        </p>
      ) : null}

      <section className="rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium">Subscription</h2>

        {subscription ? (
          <div className="mt-3 space-y-1 text-sm">
            <p>
              Status:{" "}
              <span className="font-medium">{subscription.status}</span>
            </p>
            {subscription.current_period_end ? (
              <p className="text-gray-500">
                {subscription.cancel_at_period_end ? "Ends" : "Renews"} on{" "}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">
            You don’t have a subscription yet.
          </p>
        )}

        <div className="mt-5">
          {isActive ? (
            <form action="/api/stripe/portal" method="post">
              <button
                type="submit"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Manage subscription
              </button>
            </form>
          ) : (
            <form action="/api/stripe/checkout" method="post">
              <button
                type="submit"
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
