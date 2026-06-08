"use server";

import { redirect } from "next/navigation";
import * as z from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const CredentialsSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: z.string().min(8, { error: "Password must be at least 8 characters." }),
});

export type AuthFormState = { error: string } | undefined;

function parseCredentials(formData: FormData) {
  return CredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function signup(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = parseCredentials(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  // With email confirmation disabled, signUp returns an active session and the
  // user is logged in immediately. (If confirmation is later enabled, the user
  // would need to verify their email before a session exists.)
  redirect("/dashboard");
}

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = parseCredentials(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Invalid email or password." };
  }

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
