"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Filter } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { kCatalog, ALL_CATEGORIES } from "@/data/catalog";
import CategorySection from "@/components/CategorySection";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import SocialLinksBar from "@/components/footer/SocialLinksBar";

export default function HomePage() {
  const cart = useCart();

  // Loader gate: ready once catalog is synced (we don't block on social images)
  const [ready, setReady] = useState(false);

  // Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Filtered catalog
  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return kCatalog.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(item.category);
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategories]);

  // Boot: sync catalog then reveal page (tiny delay prevents loader flash)
  useEffect(() => {
    let cancelled = false;
    cart.syncCatalog(kCatalog);
    const t = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 150);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Social links (image icons)
  const socialLinks = [
    { href: "https://www.instagram.com/chandhinihirers_nellore/#", label: "Instagram", imgSrc: "./icons/instagram.png", size: 22 },
    { href: "https://youtube.com/@chandhinihirers_nellore", label: "YouTube", imgSrc: "./icons/youtube.png", size: 22 },
    { href: "https://maps.app.goo.gl/o3orgsRNWrdUJZh76", label: "Google Maps", imgSrc: "./icons/map-pin.png", size: 22 },
  ];

  return (
    <>
      <FullScreenLoader show={!ready} message="Loading Chandini Hirers…" />

      <main
        className="max-w-6xl mx-auto px-2 sm:px-4 pb-44 sm:pb-32"
        aria-busy={!ready}
        style={{ visibility: ready ? "visible" : "hidden" }}
      >
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

          {/* Filter Button */}
          <div className="relative">
            <button
              type="button"
              className="px-4 py-2 rounded-xl border bg-white shadow-sm hover:bg-gray-100 flex items-center gap-2 whitespace-nowrap"
              onClick={() => setShowFilterDropdown((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={showFilterDropdown}
              aria-controls="filter-dropdown"
            >
              <Filter className="w-5 h-5" />
              Filter
            </button>

            {/* Dropdown Panel */}
            {showFilterDropdown && (
              <div
                id="filter-dropdown"
                role="menu"
                className="absolute right-0 z-50 mt-2 w-60 bg-white border rounded-xl shadow-lg p-4 space-y-2"
              >
                <div className="text-sm font-medium text-gray-700 mb-1">Filter by Category</div>
                {ALL_CATEGORIES.map((cat) => {
                  const checked = selectedCategories.includes(cat);
                  return (
                    <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedCategories((prev) =>
                            checked ? prev.filter((c) => c !== cat) : [...prev, cat]
                          )
                        }
                        className="accent-[color:var(--color-primary)]"
                        aria-checked={checked}
                      />
                      {cat}
                    </label>
                  );
                })}
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-sm text-blue-600 hover:underline mt-2"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Catalog */}
        <section className="mt-4 space-y-3">
          {ALL_CATEGORIES.map((cat) => (
            <CategorySection key={cat} category={cat} items={filteredCatalog} />
          ))}
        </section>

        {/* Fixed Footer: CTA first, Socials after (good hierarchy) */}
        <footer
          className="fixed inset-x-0 bottom-0 bg-white/95 backdrop-blur-md border-t"
          style={{ paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}
        >
          <div className="max-w-6xl mx-auto px-4 pt-2">
            {/* CTA */}
            {cart?.totalItems > 0 && (
              <Link
                href="/preview"
                className="block w-full text-center rounded-xl bg-[color:var(--color-primary)] hover:brightness-110 text-white py-3 shadow text-sm sm:text-base"
                aria-label={`View cart and order. Items ${cart.totalItems}, total ₹${(cart.totalAmount ?? 0).toFixed(0)}`}
              >
                View cart & order • {cart.totalItems} | ₹{(cart.totalAmount ?? 0).toFixed(0)}
              </Link>
            )}

            {/* Socials (image icons) */}
            <div className="mt-2">
              <SocialLinksBar links={socialLinks} />
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
