import Analytics from "@/components/analytics";
import WaitlistForm from "@/components/waitlist-form";

const STEPS = [
  {
    title: "Connect your repo",
    body: "One-click GitHub install. Crossroad watches your merged pull requests and releases.",
  },
  {
    title: "We write the changelog",
    body: "Each release is summarized into clear, customer-facing notes — grouped, deduped, and human-readable.",
  },
  {
    title: "Publish anywhere",
    body: "A polished hosted changelog page, plus an embeddable widget and RSS. Always up to date.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-20 font-sans text-black dark:bg-black dark:text-white sm:py-28">
      <Analytics />

      <section className="w-full max-w-2xl text-center">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1 text-xs font-medium tracking-wide text-black/60 dark:border-white/15 dark:text-white/60">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Early access — join the waitlist
        </p>

        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Changelogs that write themselves.
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-black/60 dark:text-white/60">
          Crossroad connects to your repository and turns merged work into a
          polished, public changelog — automatically. Stop writing release notes
          by hand. Ship, and let your changelog keep itself current.
        </p>

        <WaitlistForm />
      </section>

      <section className="mt-24 grid w-full max-w-4xl gap-8 sm:mt-28 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.title} className="text-left">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-sm font-semibold text-black/60 dark:border-white/15 dark:text-white/60">
              {i + 1}
            </div>
            <h2 className="text-base font-semibold tracking-tight">{step.title}</h2>
            <p className="mt-2 text-sm text-black/55 dark:text-white/50">{step.body}</p>
          </div>
        ))}
      </section>

      <footer className="mt-24 text-sm text-black/40 dark:text-white/35 sm:mt-28">
        © Crossroad. Building in public.
      </footer>
    </main>
  );
}
