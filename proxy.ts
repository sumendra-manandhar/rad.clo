import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { authEnabled, supabasePublicKey, supabaseUrl } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin: optimistic check only — bounce visitors without a session cookie.
  // Every admin API route and page still verifies the signed cookie itself
  // (lib/server/auth.ts).
  if (pathname.startsWith("/admin")) {
    if (pathname !== "/admin/login" && !request.cookies.has("radclo_admin")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // Customer pages that need the signed-in user: keep the Supabase session
  // fresh (only here, so other pages don't pay for it).
  let response = NextResponse.next({ request });
  if (!authEnabled) return response;
  const sb = createServerClient(supabaseUrl, supabasePublicKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await sb.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/cart", "/account", "/account/:path*", "/api/orders", "/api/account/:path*"],
};
