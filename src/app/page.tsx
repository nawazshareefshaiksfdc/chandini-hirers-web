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
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(item.category);
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

  const handleClearAll = () => {
    if (cart.totalItems === 0) return;
    if (confirm("Are you sure you want to remove all items from your cart?")) {
      cart.clear();
    }
  };

  return (
    <>
      <FullScreenLoader show={!ready} dim={0.25} block={false} />

      <main className="pb-44 sm:pb-32" aria-busy={!ready} style={{ visibility: ready ? "visible" : "hidden" }}>
        <header className="ui-card mt-1 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Event Rentals Catalog</h1>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              Chairs, tents, cooking and more
            </p>
          </div>

          <Link href="/preview" className="ui-btn ui-btn-primary w-full sm:w-auto">
            <span className="font-semibold">My Cart</span>
            <span
              className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1 text-xs font-semibold text-[color:var(--color-primary)]"
              style={{ backgroundColor: "var(--color-bg)" }}
            >
              {cart.totalItems}
            </span>
            {cart.totalItems > 0 && <span className="text-sm font-semibold text-white/90">₹{cart.totalAmount.toFixed(0)}</span>}
          </Link>
        </header>

        <div className="relative mb-4 mt-6 flex flex-col gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: "var(--color-muted)" }} />
            <input
              type="text"
              placeholder="Search items"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ui-input w-full pl-10"
              aria-label="Search items"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:justify-end">
            <div className="relative w-full lg:w-auto">
              <button
                type="button"
                className="ui-btn w-full"
                onClick={() => setShowFilterDropdown((prev) => !prev)}
                aria-expanded={showFilterDropdown}
                aria-controls="filter-dropdown"
              >
                <Filter className="h-4 w-4" />
                Filter
              </button>

              {showFilterDropdown && (
                <div
                  id="filter-dropdown"
                  role="menu"
                  className="absolute left-0 top-full z-50 mt-2 w-full rounded-xl border p-4 shadow-lg sm:w-72"
                  style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
                >
                  <div className="mb-2 text-sm font-medium">Filter by category</div>
                  <div className="space-y-2">
                    {ALL_CATEGORIES.map((cat) => {
                      const checked = selectedCategories.includes(cat);
                      return (
                        <label key={cat} className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 text-sm transition-all duration-200 hover:bg-[color:var(--color-bg)]">
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
                  </div>
                  <button type="button" onClick={() => setSelectedCategories([])} className="mt-3 text-sm text-[color:var(--color-primary)]">
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            <button
              className="ui-btn w-full"
              onClick={handleClearAll}
              disabled={cart.totalItems === 0}
              title={cart.totalItems === 0 ? "Nothing to clear" : "Remove all selected items"}
            >
              Clear All
            </button>
          </div>
        </div>

        <section className="mt-4 space-y-3">
          {ALL_CATEGORIES.map((cat) => (
            <CategorySection key={cat} category={cat} items={filteredCatalog} />
          ))}
        </section>

        <footer
          className="fixed inset-x-0 bottom-0 border-t backdrop-blur-md"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-card) 92%, transparent)",
            borderColor: "var(--color-border)",
            paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
          }}
        >
          <div className="mx-auto w-full max-w-[1200px] px-4 pt-2 sm:px-6 lg:px-8">
            {cart.totalItems > 0 && (
              <Link href="/preview" className="ui-btn ui-btn-primary block w-full text-center">
                View cart and order • {cart.totalItems} | ₹{cart.totalAmount.toFixed(0)}
              </Link>
            )}

            <div className="mt-2 flex items-center justify-center gap-3 pb-2 sm:gap-4">
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


