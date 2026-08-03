"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import CartDrawer from "@/components/CartDrawer";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/customize", label: "Customize" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { totalCount, openCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-md font-poppins">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-neutral-900">
            Rad.Clo
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {LINKS.map((l) => {
              const active =
                l.href === "/"
                  ? pathname === "/"
                  : (pathname || "").startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`text-sm font-medium transition-colors ${
                    active
                      ? "text-neutral-900"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/customize"
              className="hidden sm:inline-flex items-center rounded-full bg-neutral-900 text-white text-xs font-semibold px-4 py-2 hover:bg-neutral-700 transition-colors"
            >
              Design Your Own
            </Link>
            <button
              onClick={openCart}
              aria-label="Open cart"
              className="relative p-2 rounded-full hover:bg-neutral-100 transition-colors"
            >
              <ShoppingBag className="w-5 h-5 text-neutral-900" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {totalCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-full hover:bg-neutral-100"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-neutral-200 px-4 py-4 flex flex-col gap-3 bg-white">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-neutral-800 py-1"
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </header>
      <CartDrawer />
    </>
  );
}
