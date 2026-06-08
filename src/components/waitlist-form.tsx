"use client";

import { useState } from "react";
import { joinWaitlist, recordEvent, storeConfigured } from "@/lib/store";

type Status = "idle" | "submitting" | "success" | "error";

// Pragmatic, permissive email check — the store is the source of truth, this is
// just to catch obvious typos before a round-trip.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();

    if (!EMAIL_RE.test(trimmed)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    if (!storeConfigured) {
      // The page is deployed before the backend is wired; be honest rather than
      // silently dropping the address.
      setStatus("error");
      setMessage("The waitlist is opening shortly — please check back soon.");
      return;
    }

    setStatus("submitting");
    setMessage("");
    try {
      await joinWaitlist(trimmed);
      void recordEvent("signup", window.location.pathname);
      setStatus("success");
      setMessage("You're on the list. We'll be in touch.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="mx-auto mt-10 max-w-md rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-700 dark:text-emerald-300"
      >
        {message}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-10 w-full max-w-md" noValidate>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="waitlist-email" className="sr-only">
          Email address
        </label>
        <input
          id="waitlist-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          disabled={status === "submitting"}
          className="h-12 flex-1 rounded-lg border border-black/15 bg-white px-4 text-base text-black outline-none transition placeholder:text-black/35 focus:border-black/40 focus:ring-2 focus:ring-black/10 disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/40"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="h-12 shrink-0 rounded-lg bg-black px-6 text-base font-medium text-white transition hover:bg-black/85 focus:outline-none focus:ring-2 focus:ring-black/30 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
        >
          {status === "submitting" ? "Joining…" : "Join waitlist"}
        </button>
      </div>
      <p
        className={`mt-3 min-h-5 text-sm ${
          status === "error" ? "text-red-600 dark:text-red-400" : "text-black/45 dark:text-white/40"
        }`}
        aria-live="polite"
      >
        {message || "No spam. Just one email when early access opens."}
      </p>
    </form>
  );
}
