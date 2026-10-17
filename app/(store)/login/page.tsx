import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, MapPin, Clock } from "lucide-react";
import GoogleButton from "@/components/GoogleButton";
import { currentUser } from "@/lib/server/user";
import { authEnabled } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const raw = one(sp.next) || "/account";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/account";
  if (await currentUser()) redirect(next);

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <p className="font-display text-3xl font-bold">
        Rad<span className="text-flame">.</span>Clo
      </p>
      <h1 className="font-display text-4xl font-bold tracking-tight mt-6">Sign in</h1>
      <p className="text-muted mt-2">Design freely — you only need an account to place an order.</p>

      <div className="mt-8 rounded-3xl bg-white border border-line p-6 space-y-5">
        {authEnabled ? (
          <GoogleButton next={next} />
        ) : (
          <p className="text-sm text-muted">Sign-in isn&apos;t set up yet. You can still place orders without an account.</p>
        )}
        {one(sp.error) && <p className="text-sm text-red-600 text-center">Sign-in didn&apos;t finish. Please try again.</p>}
        <ul className="space-y-3 text-sm">
          {[
            [Package, "See all your orders in one place"],
            [Clock, "Track printing and delivery with your tracking ID"],
            [MapPin, "Your phone and address are saved for next time"],
          ].map(([Icon, text]) => {
            const I = Icon as typeof Package;
            return (
              <li key={text as string} className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-paper flex items-center justify-center shrink-0">
                  <I className="w-4 h-4" />
                </span>
                {text as string}
              </li>
            );
          })}
        </ul>
      </div>
      <p className="text-xs text-muted text-center mt-6">
        Have a tracking ID?{" "}
        <Link href="/track" className="underline font-medium text-ink">
          Track an order without signing in
        </Link>
      </p>
    </div>
  );
}
