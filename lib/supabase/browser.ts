"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authEnabled, supabasePublicKey, supabaseUrl } from "./config";

let client: SupabaseClient | null = null;

/** Supabase client for sign-in in the browser (null when sign-in isn't set up). */
export function authClient() {
  if (!authEnabled) return null;
  return (client ??= createBrowserClient(supabaseUrl, supabasePublicKey));
}

/** Starts "Continue with Google"; comes back to `next` after signing in. */
export async function signInWithGoogle(next = "/") {
  const sb = authClient();
  if (!sb) return;
  const back = new URL("/auth/callback", window.location.origin);
  back.searchParams.set("next", next.startsWith("/") ? next : "/");
  await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: back.toString() } });
}
