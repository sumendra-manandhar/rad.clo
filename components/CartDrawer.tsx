"use client";

import Link from "next/link";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, totalPrice } =
    useCart();

  return (
    <>
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 font-poppins flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200">
          <h2 className="text-lg font-semibold">Your Cart ({items.length})</h2>
          <button onClick={closeCart} className="p-1.5 rounded-full hover:bg-neutral-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-neutral-500">
              <p className="text-sm">Your cart is empty.</p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="text-sm underline text-neutral-900"
              >
                Browse the shop
              </Link>
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4">
                  <div
                    className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-neutral-200"
                    style={{ backgroundColor: item.color || "#eee" }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover mix-blend-multiply"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Size {item.size} · {item.colorLabel || "Custom color"}
                      {item.custom && item.designName
                        ? ` · ${item.designName}`
                        : ""}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-neutral-300 rounded-full">
                        <button
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          className="p-1.5 hover:bg-neutral-100 rounded-full"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs w-6 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          className="p-1.5 hover:bg-neutral-100 rounded-full"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold">
                        ₹{item.price * item.qty}
                      </span>
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
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-neutral-200 px-6 py-5 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Subtotal</span>
              <span className="font-semibold text-lg">₹{totalPrice}</span>
            </div>
            <Link
              href="/cart"
              onClick={closeCart}
              className="block text-center w-full rounded-full bg-neutral-900 text-white text-sm font-semibold py-3 hover:bg-neutral-700 transition-colors"
            >
              View Cart & Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
