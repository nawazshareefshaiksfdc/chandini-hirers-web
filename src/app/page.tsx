"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { kCatalog, ALL_CATEGORIES } from "@/data/catalog";
import CategorySection from "@/components/CategorySection";

export default function HomePage() {
  const cart = useCart();

  // Not strictly needed for Home, but cheap to keep totals correct on first load:
  useEffect(() => {
    cart.syncCatalog(kCatalog);
  }, []); // eslint-disable-line

  // quick sanity log
  useEffect(() => {
    // Should be > 0 (yours is 8)
    console.log("HOME kCatalog count:", kCatalog.length);
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-4 pb-24">
      <header className="mt-3 py-4 px-4 rounded-2xl bg-[color:var(--color-card)] border shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chandini Hirers</h1>
          <p className="text-sm opacity-80">Event rentals • Chairs • Tents • Cooking</p>
        </div>

        <Link
          href="/preview"
          className="relative inline-flex items-center gap-2 rounded-full px-4 py-2 border shadow-sm bg-white/80 hover:bg-white transition"
        >
          <span className="font-medium">My Items</span>
          <span className="text-xs bg-[color:var(--color-primary)] text-white rounded-full px-2 py-0.5">
            {cart.totalItems}
          </span>
          <span className="text-sm font-semibold text-[color:var(--color-primary)]">
            ₹{cart.totalAmount.toFixed(0)}
          </span>
        </Link>
      </header>

      {/* 🔥 The item list */}
      <section className="mt-4 space-y-3">
        {ALL_CATEGORIES.map((cat) => (
          <CategorySection key={cat} category={cat} items={kCatalog} />
        ))}
      </section>

      <footer className="fixed inset-x-0 bottom-0">
        <div className="max-w-6xl mx-auto px-4 pb-4">
          <Link
            href="/preview"
            className="block w-full text-center rounded-xl bg-[color:var(--color-primary)] hover:brightness-110 text-white py-3 shadow"
          >
            My Items • {cart.totalItems} | ₹{cart.totalAmount.toFixed(0)}
          </Link>
        </div>
      </footer>
    </main>
  );
}
