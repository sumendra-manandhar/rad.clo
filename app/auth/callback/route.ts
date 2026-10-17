import { NextResponse, type NextRequest } from "next/server";
import { authServerClient } from "@/lib/server/user";

// Google sends the customer back here after signing in.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const raw = url.searchParams.get("next") || "/";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  if (code) {
    const sb = await authServerClient();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL(`/login?error=1&next=${encodeURIComponent(next)}`, url.origin));
}
