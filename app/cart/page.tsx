"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { createOrder } from "@/lib/orders";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function CartPage() {
  const { items, removeItem, updateQty, totalPrice, clearCart } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacing(true);
    // Saves the order (and uploads any custom design files) to Supabase so
    // it shows up in /admin/orders. If Supabase isn't configured yet,
    // createOrder() resolves to null and we still confirm the order to the
    // customer — see SETUP.md to connect a backend so orders are actually
    // captured somewhere.
    const result = await createOrder({
      customerName: form.name,
      phone: form.phone,
      address: form.address,
      items,
      totalPrice,
    });
    setOrderId(result?.id || null);
    setPlacing(false);
    setPlaced(true);
    clearCart();
  };

  if (placed) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center font-poppins">
        <CheckCircle2 className="w-14 h-14 mx-auto text-green-600 mb-4" />
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
          Order received!
        </h1>
        <p className="text-neutral-500 mb-2">
          Thanks {form.name || "there"} — we'll reach out shortly to confirm
          details and payment before printing begins.
        </p>
        {orderId && (
          <p className="text-xs text-neutral-400 mb-8">
            Order reference: {orderId.slice(0, 8).toUpperCase()}
          </p>
        )}
        {!orderId && <div className="mb-8" />}
        <Link
          href="/shop"
          className="inline-block bg-neutral-900 text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-neutral-700"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-poppins">
      <h1 className="text-3xl font-semibold text-neutral-900 mb-8">
        Your Cart
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-neutral-500 mb-4">Your cart is empty.</p>
          <Link
            href="/shop"
            className="inline-block bg-neutral-900 text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-neutral-700"
          >
            Browse the Shop
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10">
          <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4 py-6">
                <div
                  className="w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-neutral-200"
                  style={{ backgroundColor: item.color || "#eee" }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover mix-blend-multiply"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900">{item.name}</p>
                  <p className="text-sm text-neutral-500 mt-1">
                    Size {item.size} · {item.colorLabel || "Custom color"}
                    {item.custom && item.designName
                      ? ` · Design: ${item.designName}`
                      : item.custom
                        ? " · Custom"
                        : ""}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-neutral-300 rounded-full">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="p-2 hover:bg-neutral-100 rounded-full"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm w-8 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="p-2 hover:bg-neutral-100 rounded-full"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="font-semibold">₹{item.price * item.qty}</span>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-neutral-400 hover:text-red-600 h-fit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>

          <div>
            <div className="border border-neutral-200 rounded-xl p-6 sticky top-24">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-neutral-500">Subtotal</span>
                <span className="font-medium">₹{totalPrice}</span>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-neutral-500">Shipping</span>
                <span className="font-medium">Calculated at confirmation</span>
              </div>
              <div className="flex justify-between text-base font-semibold border-t border-neutral-200 pt-4 mb-6">
                <span>Total</span>
                <span>₹{totalPrice}</span>
              </div>

              {!checkoutOpen ? (
                <button
                  onClick={() => setCheckoutOpen(true)}
                  className="w-full bg-neutral-900 text-white text-sm font-semibold py-3.5 rounded-full hover:bg-neutral-700 transition-colors"
                >
                  Proceed to Checkout
                </button>
              ) : (
                <form onSubmit={handlePlaceOrder} className="space-y-3">
                  <input
                    required
                    placeholder="Full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-neutral-900"
                  />
                  <input
                    required
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-neutral-900"
                  />
                  <textarea
                    required
                    placeholder="Delivery address"
                    rows={3}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full border border-neutral-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-neutral-900 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={placing}
                    className="w-full bg-neutral-900 text-white text-sm font-semibold py-3.5 rounded-full hover:bg-neutral-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {placing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Placing Order…
                      </>
                    ) : (
                      "Place Order"
                    )}
                  </button>
                  <p className="text-[11px] text-neutral-400 text-center">
                    Payment is collected on confirmation — no card details needed yet.
                  </p>
                  {!isSupabaseConfigured && (
                    <p className="text-[11px] text-amber-600 text-center">
                      Note: backend isn't connected yet, so this order won't
                      be saved to Admin. See SETUP.md.
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
