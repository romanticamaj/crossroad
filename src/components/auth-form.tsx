"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { AuthFormState } from "@/app/actions/auth";

type AuthAction = (
  prev: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "signup";
  action: AuthAction;
}) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    action,
    undefined,
  );

  const isSignup = mode === "signup";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-sm text-gray-500">
          {isSignup
            ? "Start automating your changelog."
            : "Log in to your Crossroad account."}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={8}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
          />
        </div>

        {state?.error ? (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-60"
        >
          {pending
            ? "Please wait…"
            : isSignup
              ? "Sign up"
              : "Log in"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-gray-900 underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            Need an account?{" "}
            <Link href="/signup" className="font-medium text-gray-900 underline">
              Sign up
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
