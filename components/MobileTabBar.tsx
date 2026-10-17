"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Plus, ShoppingBag, Menu, X, Ruler, Users, MessageCircle, HelpCircle, Sparkles, Package, Truck } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { CONTACT, messengerUrl, viberUrl, whatsappUrl } from "@/lib/contact";

/** App-style bottom navigation on phones (hidden from md up). */
export default function MobileTabBar() {
  const pathname = usePathname() || "/";
  const { totalCount, openCart } = useCart();
  const [more, setMore] = useState(false);

  // Escape closes the sheet.
  useEffect(() => {
    if (!more) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMore(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [more]);

  const tab = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 pt-2 pb-1.5 text-[10px] font-semibold transition active:scale-90 ${
      active ? "text-ink" : "text-ink/45"
    }`;

  const links = [
    { href: "/account", label: "My orders", Icon: Package },
    { href: "/track", label: "Track an order", Icon: Truck },
    { href: "/#how", label: "How it works", Icon: Sparkles },
    { href: "/size-guide", label: "Size chart", Icon: Ruler },
    { href: "/contact#quote", label: "Bulk quote (20+ pieces)", Icon: Users },
    { href: "/#faq", label: "FAQ", Icon: HelpCircle },
    { href: "/contact", label: "Contact us", Icon: MessageCircle },
  ];
  const chats = [
    { href: whatsappUrl("Hi Rad.Clo!"), label: "WhatsApp", cls: "bg-[#25D366] text-white" },
    { href: viberUrl, label: "Viber", cls: "bg-[#7360F2] text-white" },
    { href: messengerUrl, label: "Messenger", cls: "bg-[#0084FF] text-white" },
  ].filter((c) => c.href);

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-paper/90 backdrop-blur-xl border-t border-line pb-[env(safe-area-inset-bottom)]"
        aria-label="App navigation"
      >
        <div className="grid grid-cols-5 items-end h-16">
          <Link href="/" className={tab(pathname === "/")}>
            <Home className="w-5.5 h-5.5" strokeWidth={pathname === "/" ? 2.5 : 2} /> Home
          </Link>
          <Link href="/shop" className={tab(pathname.startsWith("/shop"))}>
            <LayoutGrid className="w-5.5 h-5.5" strokeWidth={pathname.startsWith("/shop") ? 2.5 : 2} /> Shop
          </Link>
          <Link href="/customize" className="flex flex-col items-center gap-0.5 pb-1.5 text-[10px] font-semibold text-ink active:scale-90 transition">
            <span className="-mt-6 w-14 h-14 rounded-full bg-lime ring-4 ring-paper shadow-lg flex items-center justify-center">
              <Plus className="w-6 h-6" strokeWidth={3} />
            </span>
            Create
          </Link>
          <button onClick={openCart} className={`relative ${tab(false)}`} aria-label={`Cart, ${totalCount} item(s)`}>
            <span className="relative">
              <ShoppingBag className="w-5.5 h-5.5" />
              {totalCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-flame text-white text-[10px] font-bold rounded-full min-w-4.5 h-4.5 flex items-center justify-center px-1">
                  {totalCount}
                </span>
              )}
            </span>
            Cart
          </button>
          <button onClick={() => setMore(true)} className={tab(more)} aria-expanded={more}>
            <Menu className="w-5.5 h-5.5" /> More
          </button>
        </div>
      </nav>

      {/* "More" bottom sheet */}
      <div
        className={`md:hidden fixed inset-0 z-50 bg-ink/40 transition-opacity duration-300 ${more ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setMore(false)}
        aria-hidden={!more}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="More"
        className={`md:hidden fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-paper px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl transition-transform duration-300 ease-out ${
          more ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto w-10 h-1.5 rounded-full bg-ink/15 mb-4" />
        <div className="flex items-center justify-between mb-2">
          <p className="font-display text-xl font-bold">
            Rad<span className="text-flame">.</span>Clo
          </p>
          <button onClick={() => setMore(false)} className="w-9 h-9 rounded-full bg-white border border-line flex items-center justify-center" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <ul className="divide-y divide-line max-h-[60vh] overflow-y-auto">
          {links.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link href={href} onClick={() => setMore(false)} className="flex items-center gap-3 py-3.5 text-[15px] font-medium active:opacity-60">
                <span className="w-9 h-9 rounded-xl bg-white border border-line flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
        {chats.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            {chats.map((c) => (
              <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" className={`rounded-2xl py-3 text-center text-xs font-semibold ${c.cls}`}>
                {c.label}
              </a>
            ))}
          </div>
        )}
        <p className="text-[11px] text-muted text-center mt-4">{CONTACT.hours}</p>
      </div>
    </>
  );
}
