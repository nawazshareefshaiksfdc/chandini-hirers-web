"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Filter } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { kCatalog, ALL_CATEGORIES } from "@/data/catalog";
import CategorySection from "@/components/CategorySection";

export default function HomePage() {
  const cart = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return kCatalog.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(item.category);
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategories]);


  useEffect(() => {
    cart.syncCatalog(kCatalog);
  }, []); // eslint-disable-line

  useEffect(() => {
    console.log("HOME kCatalog count:", kCatalog.length);
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-2 sm:px-4 pb-32 sm:pb-24">
      <header className="mt-3 py-4 px-4 rounded-2xl bg-[color:var(--color-card)] border shadow-sm flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Chandini Hirers</h1>
          <p className="text-sm opacity-80">Event rentals • Chairs • Tents • Cooking</p>
        </div>

        <Link
          href="/preview"
          className="relative inline-flex items-center gap-2 rounded-full px-4 py-2 border shadow-sm bg-white/80 hover:bg-white transition text-sm sm:text-base"
        >
          <span className="font-medium">My Cart</span>
          <span className="text-xs bg-[color:var(--color-primary)] text-white rounded-full px-2 py-0.5">
            {cart.totalItems}
          </span>
          <span className="text-sm font-semibold text-[color:var(--color-primary)]">
            ₹{cart.totalAmount.toFixed(0)}
          </span>
        </Link>
      </header>
      <div className="mt-6 mb-4 flex flex-col sm:flex-row gap-3 items-stretch relative">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search items…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
          />
        </div>

        {/* Filter Button */}
        <div className="relative">
          <button
            type="button"
            className="px-4 py-2 rounded-xl border bg-white shadow-sm hover:bg-gray-100 flex items-center gap-2 whitespace-nowrap"
            onClick={() => setShowFilterDropdown((prev) => !prev)}
          >
            <Filter className="w-5 h-5" />
            Filter
          </button>

          {/* Dropdown Panel */}
          {showFilterDropdown && (
            <div className="absolute right-0 z-50 mt-2 w-60 bg-white border rounded-xl shadow-lg p-4 space-y-2">
              <div className="text-sm font-medium text-gray-700 mb-1">Filter by Category</div>
              {ALL_CATEGORIES.map((cat) => {
                const checked = selectedCategories.includes(cat);
                return (
                  <label key={cat} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedCategories((prev) =>
                          checked ? prev.filter((c) => c !== cat) : [...prev, cat]
                        )
                      }
                      className="accent-[color:var(--color-primary)]"
                    />
                    {cat}
                  </label>
                );
              })}
              <button
                onClick={() => setSelectedCategories([])}
                className="text-sm text-blue-500 hover:underline mt-2"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>


      {/* 🔥 Catalog */}
      <section className="mt-4 space-y-3">
        {ALL_CATEGORIES.map((cat) => (
          <CategorySection key={cat} category={cat} items={filteredCatalog} />
        ))}
      </section>

      {/* Fixed Footer */}
      <footer className="fixed inset-x-0 bottom-0 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 pb-4 pt-2">
          <Link
            href="/preview"
            className="block w-full text-center rounded-xl bg-[color:var(--color-primary)] hover:brightness-110 text-white py-3 shadow text-sm sm:text-base"
          >
            View cart & order • {cart.totalItems} | ₹{cart.totalAmount.toFixed(0)}
          </Link>
        </div>
      </footer>
    </main>
  );
}
