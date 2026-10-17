"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Images, FolderTree, ShoppingCart, Shirt, ExternalLink, LogOut, ClipboardList, UsersRound } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard },
  { href: "/admin/designs", label: "Designs", Icon: Images },
  { href: "/admin/categories", label: "Categories", Icon: FolderTree },
  { href: "/admin/orders", label: "Orders", Icon: ShoppingCart },
  { href: "/admin/quotes", label: "Quotes", Icon: ClipboardList },
  { href: "/admin/customers", label: "Customers", Icon: UsersRound },
  { href: "/admin/pricing", label: "Garments", Icon: Shirt },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <aside className="lg:w-60 lg:min-h-screen bg-ink text-paper lg:sticky lg:top-0 lg:h-screen flex lg:flex-col">
      <div className="px-5 py-4 lg:py-6 flex items-center justify-between lg:block w-full lg:w-auto">
        <Link href="/admin" className="font-display text-xl font-extrabold">
          Rad<span className="text-flame">.</span>Clo <span className="text-xs font-medium text-paper/40 ml-1">admin</span>
        </Link>
      </div>
      <nav className="hidden lg:flex flex-col gap-1 px-3 flex-1">
        {LINKS.map(({ href, label, Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-lime text-ink" : "text-paper/70 hover:bg-paper/10 hover:text-paper"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden lg:flex flex-col gap-1 px-3 pb-6">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-paper/60 hover:text-paper">
          <ExternalLink className="w-4 h-4" /> View store
        </Link>
        <button onClick={logout} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-paper/60 hover:text-paper">
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </div>
      {/* Mobile */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-ink border-t border-paper/10 grid grid-cols-8">
        {LINKS.map(({ href, label, Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`flex flex-col items-center gap-1 py-2.5 text-[10px] ${active ? "text-lime" : "text-paper/60"}`}>
              <Icon className="w-5 h-5" /> {label}
            </Link>
          );
        })}
        <button onClick={logout} className="flex flex-col items-center gap-1 py-2.5 text-[10px] text-paper/60">
          <LogOut className="w-5 h-5" /> Log out
        </button>
      </nav>
    </aside>
  );
}
