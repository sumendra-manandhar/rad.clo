"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, CheckCircle2, Loader2, Copy, Check, Package, LogOut } from "lucide-react";
import GoogleButton from "@/components/GoogleButton";
import { authEnabled } from "@/lib/supabase/config";
import { useCart } from "@/lib/cart-context";
import { FREE_SHIPPING_FROM, formatPrice, shippingFor } from "@/lib/garments";
import { CartThumb, PrintList, itemSummary } from "@/components/CartDrawer";

export default function CartPage() {
  const { items, removeItem, updateQty, totalPrice, clearCart } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", note: "" });
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<{ number: number; total: number; trackCode?: string } | null>(null);
  // Signed-in customer (orders need an account once Google sign-in is set up)
  const [account, setAccount] = useState<{ name: string; email: string; avatarUrl?: string } | null>(null);
  const [checking, setChecking] = useState(authEnabled);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authEnabled) return;
    let alive = true;
    fetch("/api/account/profile")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setChecking(false);
        if (!d.user) return;
        setAccount(d.user);
        // Prefill from the account and the last order; never overwrite what they typed.
        setForm((f) => ({
          ...f,
          name: f.name || d.user.name || "",
          email: f.email || d.user.email || "",
          phone: f.phone || d.saved?.phone || "",
          address: f.address || d.saved?.address || "",
        }));
      })
      .catch(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, []);

  const shipping = shippingFor(totalPrice);

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: form, items }),
      });
      const json = await res.json();
      if (res.status === 401 && json.signIn) {
        setAccount(null);
        throw new Error("Your sign-in expired — please sign in again.");
      }
      if (!res.ok) throw new Error(json.error || "Could not place the order.");
      setPlaced({ number: json.number, total: json.total, trackCode: json.trackCode });
      clearCart();
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  };

  if (placed) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <CheckCircle2 className="w-14 h-14 mx-auto text-flame mb-5" />
        <h1 className="font-display text-4xl font-bold">Order #{placed.number} received!</h1>
        <p className="text-muted mt-3">
          Thanks {form.name.split(" ")[0] || "there"} — we&apos;ll call or WhatsApp you on {form.phone} to confirm
          your design and payment before printing begins.
        </p>
        {placed.trackCode && (
          <div className="mt-8 rounded-3xl bg-white border border-line p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Your tracking ID</p>
            <p className="font-mono text-3xl font-bold tracking-wider mt-2">{placed.trackCode}</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(placed.trackCode!).then(() => setCopied(true));
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-ink"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? "Copied" : "Copy"}
              </button>
              <Link
                href={`/track/${placed.trackCode}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink text-paper px-4 py-2 text-sm font-semibold hover:bg-flame"
              >
                <Package className="w-4 h-4" /> Track order
              </Link>
            </div>
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {account && (
            <Link href="/account" className="inline-block border border-ink/20 font-semibold px-7 py-3.5 rounded-full hover:border-ink">
              My orders
            </Link>
          )}
          <Link href="/shop" className="inline-block bg-ink text-paper font-semibold px-7 py-3.5 rounded-full hover:bg-flame">
            Keep shopping
          </Link>
        </div>
      </div>
    );
  }

  const input =
    "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm focus:outline-none focus:border-ink";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-display text-5xl font-bold tracking-tight mb-10">Checkout</h1>

      {items.length === 0 ? (
        <div className="text-center py-24 rounded-3xl border border-dashed border-line">
          <p className="text-muted mb-5">Your cart is empty.</p>
          <Link href="/shop" className="inline-block bg-ink text-paper text-sm font-semibold px-6 py-3 rounded-full">
            Browse designs
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10 items-start">
          <ul className="divide-y divide-line border-y border-line">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4 py-6">
                <CartThumb item={item} className="w-24 h-24" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{item.garmentLabel}</p>
                  <p className="text-sm text-muted mt-1">{itemSummary(item)}</p>
                  <PrintList item={item} className="mt-1.5" />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-line rounded-full">
                      <button onClick={() => updateQty(item.id, item.qty - 1)} className="p-2" aria-label="Decrease">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm w-8 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} className="p-2" aria-label="Increase">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="font-semibold">{formatPrice(item.unitPrice * item.qty)}</span>
                  </div>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-muted hover:text-red-600 h-fit" aria-label="Remove">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>

          {authEnabled && !account ? (
            <div className="rounded-3xl bg-white border border-line p-6 space-y-4 lg:sticky lg:top-24">
              {checking ? (
                <div className="py-10 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted" />
                </div>
              ) : (
                <>
                  <h2 className="font-display text-2xl font-bold">Sign in to place your order</h2>
                  <p className="text-sm text-muted">
                    Your cart is saved. Sign in once and you can follow your order from printing to delivery.
                  </p>
                  <GoogleButton next="/cart" />
                  <div className="flex justify-between pt-3 border-t border-line font-display text-xl font-bold">
                    <span>Total</span>
                    <span>{formatPrice(totalPrice + shipping)}</span>
                  </div>
                  {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                </>
              )}
            </div>
          ) : (
          <form onSubmit={placeOrder} className="rounded-3xl bg-white border border-line p-6 space-y-3 lg:sticky lg:top-24">
            {account && (
              <div className="flex items-center gap-3 rounded-2xl bg-paper p-3 -mt-1 mb-2">
                {account.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={account.avatarUrl} alt="" className="w-9 h-9 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-ink text-paper flex items-center justify-center font-bold">{account.name[0]}</span>
                )}
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block font-semibold truncate">{account.name}</span>
                  <span className="block text-xs text-muted truncate">{account.email}</span>
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await fetch("/auth/signout", { method: "POST" });
                    window.location.reload();
                  }}
                  className="p-2 rounded-full text-muted hover:text-ink"
                  aria-label="Sign out"
                  title="Sign out (use another account)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
            <h2 className="font-semibold mb-1">Delivery details</h2>
            <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
            <div className="grid sm:grid-cols-2 gap-3">
              <input required type="tel" placeholder="Phone / WhatsApp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} />
              <input type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
            </div>
            <textarea required rows={3} placeholder="Delivery address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={`${input} resize-none`} />
            <textarea rows={2} placeholder="Notes for the printer (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={`${input} resize-none`} />

            <div className="pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatPrice(totalPrice)}</span></div>
              <div className="flex justify-between">
                <span className="text-muted">Shipping</span>
                <span>{shipping ? formatPrice(shipping) : "Free"}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-muted">Add {formatPrice(FREE_SHIPPING_FROM - totalPrice)} more for free shipping.</p>
              )}
              <div className="flex justify-between pt-3 border-t border-line font-display text-2xl font-bold">
                <span>Total</span><span>{formatPrice(totalPrice + shipping)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={state === "sending"}
              className="w-full flex items-center justify-center gap-2 bg-ink text-paper font-semibold py-4 rounded-full hover:bg-flame transition-colors disabled:opacity-60"
            >
              {state === "sending" && <Loader2 className="w-4 h-4 animate-spin" />} Place order
            </button>
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <p className="text-[11px] text-muted text-center">
              No card needed now — we confirm your design and payment by phone before printing.
            </p>
          </form>
          )}
        </div>
      )}
    </div>
  );
}
