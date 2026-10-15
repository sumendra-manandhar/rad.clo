import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: bounce visitors without a session cookie away from
// /admin pages. Every admin API route and page still verifies the signed
// cookie itself (lib/server/auth.ts).
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();
  if (!request.cookies.has("radclo_admin")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
