"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ArrowUpRight, Search } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import CartDrawer from "@/components/CartDrawer";
import AccountButton from "@/components/AccountButton";
import { FREE_SHIPPING_FROM, formatPrice } from "@/lib/garments";

const LINKS = [
  { href: "/shop", label: "Shop Designs" },
  { href: "/customize", label: "3D Studio" },
  { href: "/#how", label: "How it works" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { totalCount, openCart } = useCart();

  return (
    <>
      <div className="bg-ink text-paper text-[11px] sm:text-xs font-medium tracking-wide text-center py-2 px-4">
        <span className="sm:hidden">Free delivery over {formatPrice(FREE_SHIPPING_FROM)} · No minimum</span>
        <span className="hidden sm:inline">
          Free delivery across Nepal on orders over {formatPrice(FREE_SHIPPING_FROM)} · No minimum order
        </span>
      </div>
      <header className="sticky top-0 z-40 w-full border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 h-14 md:h-16">
          <Link href="/" className="font-display text-2xl font-extrabold tracking-tight">
            Rad<span className="text-flame">.</span>Clo
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {LINKS.map((l) => {
              const active = !l.href.includes("#") && (pathname || "").startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
                    active ? "bg-ink text-paper" : "text-ink/70 hover:text-ink hover:bg-ink/5"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/customize"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-lime text-ink text-sm font-semibold pl-4 pr-3 py-2 hover:bg-ink hover:text-lime transition-colors"
            >
              Start designing <ArrowUpRight className="w-4 h-4" />
            </Link>
            {/* Phones use the bottom tab bar for the cart and menu */}
            <Link href="/shop" aria-label="Search designs" className="md:hidden p-2.5 rounded-full hover:bg-ink/5">
              <Search className="w-5 h-5" />
            </Link>
            <span className="md:hidden">
              <AccountButton compact />
            </span>
            <span className="hidden md:block">
              <AccountButton />
            </span>
            <button
              onClick={openCart}
              aria-label="Open cart"
              className="relative p-2.5 rounded-full hover:bg-ink/5 transition-colors hidden md:block"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-flame text-white text-[10px] font-bold rounded-full min-w-4.5 h-4.5 flex items-center justify-center px-1">
                  {totalCount}
                </span>
              )}
            </button>

          </div>
        </div>

      </header>
      <CartDrawer />
    </>
  );
}
