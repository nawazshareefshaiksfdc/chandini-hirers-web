/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Item } from "@/types";

export type Line = { item: Item; qty: number; lineTotal: number };

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

/* ===================== Persistence ===================== */
export const CART_KEY = "chandini.cart.v3";      // current versioned key
const LEGACY_KEYS = ["cart-q"];                  // auto-migration sources

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return (v ?? fallback) as T;
  } catch {
    return fallback;
  }
}

/** Keep only positive integers. Trim zeros to save space. */
function normalize(qtyMap: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, v] of Object.entries(qtyMap || {})) {
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n) && n > 0) out[id] = Math.floor(n);
  }
  return out;
}

function loadQuantities(): Record<string, number> {
  if (typeof window === "undefined") return {};
  // 1) Try the current key
  const cur = safeParse<Record<string, unknown>>(localStorage.getItem(CART_KEY), {});
  const q = normalize(cur);
  if (Object.keys(q).length > 0) return q;

  // 2) Try legacy keys (migrate once)
  for (const key of LEGACY_KEYS) {
    const legacy = safeParse<Record<string, unknown>>(localStorage.getItem(key), {});
    const n = normalize(legacy);
    if (Object.keys(n).length > 0) {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(n));
      } catch { }
      return n;
    }
  }
  return {};
}

function saveQuantities(q: Record<string, number>) {
  try {
    const compact: Record<string, number> = {};
    for (const [id, n] of Object.entries(q)) if (n > 0) compact[id] = n;
    localStorage.setItem(CART_KEY, JSON.stringify(compact));
  } catch {
    // ignore quota/security errors
  }
}

/* ===================== Provider ===================== */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [itemsById, setItemsById] = useState<Record<string, Item>>({});

  // Load from storage on mount
  useEffect(() => {
    setQuantities(loadQuantities());
  }, []);

  // Save whenever quantities change
  useEffect(() => {
    saveQuantities(quantities);
  }, [quantities]);

  // Cross-tab sync + back/forward cache refresh
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) setQuantities(loadQuantities());
    };
    const onPageShow = (e: PageTransitionEvent) => {
      // When returning via bfcache, refresh from storage
      if ((e as any).persisted) setQuantities(loadQuantities());
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  // Keep latest item objects by id (dedup + shallow compare)
  const syncCatalog = useCallback((catalog: Item[]) => {
    setItemsById((prev) => {
      const next: Record<string, Item> = {};
      for (const it of catalog) next[it.id] = it;
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (prevKeys.length === nextKeys.length) {
        let same = true;
        for (const k of nextKeys) {
          if (prev[k] !== next[k]) { same = false; break; }
        }
        if (same) return prev;
      }
      return next;
    });
  }, []);

  const qtyFor = useCallback((item: Item) => quantities[item.id] ?? 0, [quantities]);
  const visibleQtyFor = qtyFor;

  const setQty = useCallback((item: Item, qty: number) => {
    const n = Math.max(0, Math.floor(qty || 0));
    setQuantities((prev) => {
      if (n === 0) {
        if (!(item.id in prev)) return prev;
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: n };
    });
  }, []);

  const increment = useCallback((item: Item) => {
    setQuantities((prev) => ({ ...prev, [item.id]: (prev[item.id] ?? 0) + 1 }));
  }, []);

  const decrement = useCallback((item: Item) => {
    setQuantities((prev) => {
      const cur = prev[item.id] ?? 0;
      if (cur <= 1) {
        if (!(item.id in prev)) return prev;
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: cur - 1 };
    });
  }, []);

  const clear = useCallback(() => {
    setQuantities({});
  }, []);

  const clearItem = useCallback((item: Item) => {
    setQuantities((prev) => {
      if (!(item.id in prev)) return prev;
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  }, []);


  const { totalItems, totalAmount, selectedLines } = useMemo(() => {
    let items = 0;
    let amount = 0;
    const lines: Line[] = [];
    for (const [id, qty] of Object.entries(quantities)) {
      if (qty > 0) {
        const it = itemsById[id];
        if (it) {
          const lineTotal = it.price * qty;
          lines.push({ item: it, qty, lineTotal });
          items += qty;
          amount += lineTotal;
        }
      }
    }
    // keep stable order by item name (optional)
    lines.sort((a, b) => a.item.name.localeCompare(b.item.name));
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
