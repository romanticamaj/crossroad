export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-24 font-sans dark:bg-black">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1 text-xs font-medium tracking-wide text-black/60 dark:border-white/15 dark:text-white/60">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Crossroad — early access
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Changelogs that write themselves.
        </h1>
        <p className="mt-5 text-balance text-lg text-black/60 dark:text-white/60">
          Connect a repository and Crossroad turns merged work into a polished,
          public changelog — automatically.
        </p>
        <p className="mt-10 text-sm text-black/40 dark:text-white/40">
          The product is being built. This is the M0.1 foundation deploy.
        </p>
      </div>
    </main>
  );
}
