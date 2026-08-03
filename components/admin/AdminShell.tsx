"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Package, Palette, LogOut } from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth";

const NAV = [
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/designs", label: "Designs", icon: Palette },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { session, loading, signOut } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!loading && !session && !isLoginPage) {
      router.replace("/admin/login");
    }
  }, [loading, session, isLoginPage, router]);

  // The login page renders its own full-screen layout, no sidebar.
  if (isLoginPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-poppins text-sm text-neutral-400">
        Loading…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center font-poppins text-sm text-neutral-400">
        Redirecting to login…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-poppins flex">
      <aside className="w-60 shrink-0 border-r border-neutral-200 bg-white flex flex-col">
        <div className="px-5 py-5 border-b border-neutral-200">
          <Link href="/admin/orders" className="text-lg font-extrabold text-neutral-900">
            Rad.Clo Admin
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((n) => {
            const active = pathname?.startsWith(n.href);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <Icon className="w-4 h-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-neutral-200">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
          <Link
            href="/"
            className="block mt-1 px-3 py-2 text-xs text-neutral-400 hover:text-neutral-600"
          >
            ← Back to storefront
          </Link>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
