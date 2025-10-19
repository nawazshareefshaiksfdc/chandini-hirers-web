"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Filter } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { kCatalog, ALL_CATEGORIES } from "@/data/catalog";
import SocialIcon from "@/components/SocialIcon";
import { socialLinks } from "@/data/socialLinks";
import CategorySection from "@/components/CategorySection";
import FullScreenLoader from "@/components/ui/FullScreenLoader";

export default function HomePage() {
  const cart = useCart();

  const [ready, setReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return kCatalog.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(item.category);
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategories]);

  useEffect(() => {
    let cancelled = false;
    cart.syncCatalog(kCatalog);
    const t = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Clear all items in cart
  const handleClearAll = () => {
    if (cart.totalItems === 0) return;
    if (confirm("Are you sure you want to remove all items from your cart?")) {
      cart.clear();
    }
  };

  return (
    <>
      <FullScreenLoader show={!ready} dim={0.25} block={false} />

      <main
        className="max-w-6xl mx-auto px-2 sm:px-4 pb-44 sm:pb-32"
        aria-busy={!ready}
        style={{ visibility: ready ? "visible" : "hidden" }}
      >
        <header className="mt-3 py-4 px-4 rounded-2xl bg-[color:var(--color-card)] border shadow-sm flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Chandini Hirers
            </h1>
            <p className="text-sm opacity-80">
              Event rentals • Chairs • Tents • Cooking
            </p>
          </div>

          <Link
            href="/preview"
            className="relative inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 bg-gradient-to-r from-[color:var(--color-primary)] to-indigo-500 text-white font-medium shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-200 text-sm sm:text-base"
          >
            <span className="font-semibold">🛒 My Cart</span>

            {/* Item Count Badge */}
            <span className="min-w-[22px] h-[22px] flex items-center justify-center text-xs font-semibold bg-white text-[color:var(--color-primary)] rounded-full px-1">
              {cart.totalItems}
            </span>

            {/* Total Price */}
            {cart.totalItems > 0 && (
              <span className="ml-1 text-sm font-semibold text-white/90">
                ₹{cart.totalAmount.toFixed(0)}
              </span>
            )}
          </Link>
        </header>

        {/* Controls */}
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
              aria-label="Search items"
            />
          </div>
          
          {/* Filter + Clear All */}
          <div className="relative flex items-center gap-3 sm:gap-4 justify-end">
            <div className="relative">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 flex items-center gap-2 transition shadow-sm hover:shadow-md"
                onClick={() => setShowFilterDropdown((prev) => !prev)}
              >
                <Filter className="w-5 h-5" />
                Filter
              </button>

              {showFilterDropdown && (
                <div
                  id="filter-dropdown"
                  role="menu"
                  className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg ring-1 ring-gray-200 p-4 space-y-3 z-50"
                >
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    Filter by Category
                  </div>
                  {ALL_CATEGORIES.map((cat) => {
                    const checked = selectedCategories.includes(cat);
                    return (
                      <label
                        key={cat}
                        className="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 p-1.5 rounded-md cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedCategories((prev) =>
                              checked
                                ? prev.filter((c) => c !== cat)
                                : [...prev, cat]
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
                    className="text-sm text-[color:var(--color-primary)] hover:underline mt-2"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>

            <button
              className="px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 flex items-center gap-2 transition shadow-sm hover:shadow-md disabled:opacity-50"
              onClick={handleClearAll}
              disabled={cart.totalItems === 0}
              title={
                cart.totalItems === 0
                  ? 'Nothing to clear'
                  : 'Remove all selected items'
              }
            >
              Clear All
            </button>
          </div>

        </div>

        {/* Catalog */}
        <section className="mt-4 space-y-3">
          {ALL_CATEGORIES.map((cat) => (
            <CategorySection key={cat} category={cat} items={filteredCatalog} />
          ))}
        </section>

        {/* Fixed Footer */}
        <footer
          className="fixed inset-x-0 bottom-0 bg-white/95 backdrop-blur-md border-t"
          style={{ paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}
        >
          <div className="max-w-6xl mx-auto px-4 pt-2">
            {cart.totalItems > 0 && (
              <Link
                href="/preview"
                className="block w-full text-center rounded-xl bg-[color:var(--color-primary)] hover:brightness-110 text-white py-3 shadow text-sm sm:text-base"
              >
                View cart & order • {cart.totalItems} | ₹
                {cart.totalAmount.toFixed(0)}
              </Link>
            )}

            {/* Social Icons */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 pb-2 mt-2">
              {socialLinks.map((icon, index) => (
                <SocialIcon key={index} {...icon} />
              ))}
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
