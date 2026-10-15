"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { CartItem } from "@/lib/types";

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  totalCount: number;
  totalPrice: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

// v5: items carry their designs with placement on front / back / sleeves.
const STORAGE_KEY = "radclo_cart_v5";

const printsKey = (i: Omit<CartItem, "id">) =>
  i.prints.map((p) => `${p.location}|${p.designType}|${p.artworkUrl}`).sort().join(",");

// Identical garment + colour + size + prints just bump the quantity.
const sameLine = (a: Omit<CartItem, "id">, b: Omit<CartItem, "id">) =>
  a.garment === b.garment && a.color === b.color && a.size === b.size && printsKey(a) === printsKey(b);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore unreadable storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore (private mode / quota)
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    setItems((prev) => {
      const existing = prev.find((i) => sameLine(i, item));
      if (existing) {
        return prev.map((i) => (i.id === existing.id ? { ...i, qty: i.qty + item.qty } : i));
      }
      return [...prev, { ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);

  const updateQty = useCallback(
    (id: string, qty: number) =>
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i))),
    []
  );

  const clearCart = useCallback(() => setItems([]), []);

  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        totalCount,
        totalPrice,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
