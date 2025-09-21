"use client";

import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { Item } from "@/types";

type Line = { item: Item; qty: number; lineTotal: number };

type CartCtx = {
  quantities: Record<string, number>;
  syncCatalog: (catalog: Item[]) => void;
  qtyFor: (item: Item) => number;
  visibleQtyFor: (item: Item) => number;
  setQty: (item: Item, qty: number) => void;
  increment: (item: Item) => void;
  decrement: (item: Item) => void;
  clear: () => void;
  clearItem: (item: Item) => void;
  totalItems: number;
  totalAmount: number;
  selectedLines: Line[];
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [itemsById, setItemsById] = useState<Record<string, Item>>({});

// after useState for quantities
useEffect(() => {
  try { const raw = localStorage.getItem("cart-q"); if (raw) setQuantities(JSON.parse(raw)); } catch {}
}, []);
useEffect(() => {
  try { localStorage.setItem("cart-q", JSON.stringify(quantities)); } catch {}
}, [quantities]);

  const syncCatalog = (catalog: Item[]) => {
    const map: Record<string, Item> = {};
    catalog.forEach((it) => (map[it.id] = it));
    setItemsById(map);
  };

  const qtyFor = (item: Item) => quantities[item.id] ?? 0;
  const visibleQtyFor = (item: Item) => quantities[item.id] ?? 0;

  const setQty = (item: Item, qty: number) => {
    const q = qty < 0 ? 0 : qty;
    setQuantities((prev) => ({ ...prev, [item.id]: q }));
  };

  const increment = (item: Item) => {
    setQuantities((prev) => {
      const current = prev[item.id] ?? 0;
      return { ...prev, [item.id]: current <= 0 ? 1 : current + 1 };
    });
  };

  const decrement = (item: Item) => {
    setQuantities((prev) => {
      const current = prev[item.id] ?? 0;
      if (current <= 0) return prev;
      return { ...prev, [item.id]: current - 1 };
    });
  };

  const clear = () => setQuantities({});
  const clearItem = (item: Item) =>
    setQuantities((prev) => ({ ...prev, [item.id]: 0 }));

  const { totalItems, totalAmount, selectedLines } = useMemo(() => {
    let items = 0;
    let amount = 0;
    const lines: Line[] = [];
    Object.entries(quantities).forEach(([id, qty]) => {
      if (qty > 0) {
        const it = itemsById[id];
        if (it) {
          const lineTotal = it.price * qty;
          lines.push({ item: it, qty, lineTotal });
          items += qty;
          amount += lineTotal;
        }
      }
    });
    return { totalItems: items, totalAmount: amount, selectedLines: lines };
  }, [quantities, itemsById]);

  const value: CartCtx = {
    quantities,
    syncCatalog,
    qtyFor,
    visibleQtyFor,
    setQty,
    increment,
    decrement,
    clear,
    clearItem,
    totalItems,
    totalAmount,
    selectedLines,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used inside CartProvider");
  return v;
};
