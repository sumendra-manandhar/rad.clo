import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { authEnabled, supabasePublicKey, supabaseUrl } from "@/lib/supabase/config";

export type SignedInUser = { id: string; email: string; name: string; avatarUrl?: string };

/** Supabase auth client bound to this request's cookies. */
export async function authServerClient() {
  const store = await cookies();
  return createServerClient(supabaseUrl, supabasePublicKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Server Components can't set cookies; proxy.ts refreshes the session.
        }
      },
    },
  });
}

/** The signed-in customer, verified from the session cookie (no database call). */
export async function currentUser(): Promise<SignedInUser | null> {
  if (!authEnabled) return null;
  const sb = await authServerClient();
  const { data } = await sb.auth.getClaims();
  const c = data?.claims;
  if (!c?.sub) return null;
  const meta = (c.user_metadata ?? {}) as Record<string, unknown>;
  const email = typeof c.email === "string" ? c.email : "";
  const name =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    email.split("@")[0];
  const avatar = typeof meta.avatar_url === "string" ? meta.avatar_url : typeof meta.picture === "string" ? meta.picture : undefined;
  return { id: c.sub, email, name, avatarUrl: avatar };
}
