"use client";

import { Item } from "@/types";
import ItemCard from "./ItemCard";

export default function CategorySection({
  category,
  items,
}: {
  category: string;
  items: Item[];
}) {
  // filter by exact category string
  const filtered = items.filter((it) => it.category === category);

  return (
    <details className="rounded-2xl border shadow-sm bg-[color:var(--color-card)]" open>
      <summary className="cursor-pointer select-none py-3 px-4 font-semibold text-[color:var(--color-primary)]">
        {category}
        <span className="ml-2 text-xs opacity-60">({filtered.length})</span>
      </summary>

      {/* If nothing matched, show a clear hint so we know why UI looks empty */}
      {filtered.length === 0 ? (
        <div className="px-4 pb-4 text-sm text-red-600">
          No items found for “{category}”. (Check category strings in data/catalog.ts)
        </div>
      ) : (
        <div className="px-3 pb-4">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((it) => (
              <ItemCard key={it.id} item={it} />
            ))}
          </div>
        </div>
      )}
    </details>
  );
}
