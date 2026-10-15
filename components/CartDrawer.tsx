"use client";

import Link from "next/link";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/garments";
import type { CartItem } from "@/lib/types";
import { getLocation } from "@/lib/print-locations";

export function CartThumb({ item, className = "w-20 h-20" }: { item: CartItem; className?: string }) {
  const src = item.previewUrl || item.prints?.[0]?.artworkUrl || "/tshirt-thumb.svg";
  return (
    <div
      className={`${className} rounded-xl overflow-hidden shrink-0 border border-line`}
      style={{ backgroundColor: item.previewUrl ? "#fff" : item.color }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={item.garmentLabel}
        className={`w-full h-full ${item.previewUrl ? "object-cover" : "object-contain p-2 mix-blend-multiply"}`}
      />
    </div>
  );
}

export function itemSummary(item: CartItem) {
  return [`Size ${item.size}`, item.colorLabel].join(" · ");
}

/** One line per print: "Center Chest — Tiger Face" */
export function PrintList({ item, className = "" }: { item: CartItem; className?: string }) {
  if (!item.prints?.length) return <p className={`text-xs text-muted ${className}`}>Plain (no print)</p>;
  return (
    <ul className={`text-xs text-muted space-y-0.5 ${className}`}>
      {item.prints.map((p) => (
        <li key={p.location} className="truncate">
          <span className="font-medium text-ink">{getLocation(p.location)?.label ?? p.location}</span> — {p.designName}
        </li>
      ))}
    </ul>
  );
}

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, totalPrice } = useCart();

  return (
    <>
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-50 bg-ink/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        aria-hidden={!isOpen}
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-paper shadow-2xl transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-line">
          <h2 className="font-display text-xl font-bold">Your cart ({items.length})</h2>
          <button onClick={closeCart} className="p-1.5 rounded-full hover:bg-ink/5" aria-label="Close cart">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-muted">
              <p className="text-sm">Your cart is empty.</p>
              <Link href="/shop" onClick={closeCart} className="text-sm font-semibold underline text-ink">
                Browse designs
              </Link>
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4">
                  <CartThumb item={item} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.garmentLabel}</p>
                    <p className="text-xs text-muted mt-0.5">{itemSummary(item)}</p>
                    <PrintList item={item} className="mt-1" />
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-line rounded-full">
                        <button onClick={() => updateQty(item.id, item.qty - 1)} className="p-1.5" aria-label="Decrease">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs w-6 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1)} className="p-1.5" aria-label="Increase">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold">{formatPrice(item.unitPrice * item.qty)}</span>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-muted hover:text-red-600 h-fit" aria-label="Remove">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line px-6 py-5 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-display font-bold text-xl">{formatPrice(totalPrice)}</span>
            </div>
            <Link
              href="/cart"
              onClick={closeCart}
              className="block text-center w-full rounded-full bg-ink text-paper font-semibold py-3.5 hover:bg-flame transition-colors"
            >
              Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
