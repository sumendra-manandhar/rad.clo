import { NextResponse, type NextRequest } from "next/server";
import { authServerClient } from "@/lib/server/user";
import { authEnabled } from "@/lib/supabase/config";

export async function POST(request: NextRequest) {
  if (authEnabled) await (await authServerClient()).auth.signOut();
  return NextResponse.redirect(new URL("/", request.nextUrl.origin), { status: 303 });
}
