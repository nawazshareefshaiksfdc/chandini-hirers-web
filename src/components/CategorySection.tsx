"use client";

import { Item } from "@/types";
import ItemCard from "./ItemCard";

export default function CategorySection({ category, items }: { category: string; items: Item[] }) {
  const filtered = items.filter((it) => it.category === category);
  if (filtered.length === 0) return null;

  return (
    <details
      className="rounded-2xl border shadow-sm transition-all duration-200"
      style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
      open
    >
      <summary className="cursor-pointer select-none px-4 py-3 font-semibold text-[color:var(--color-primary)]">
        {category}
        <span className="ml-2 text-xs" style={{ color: "var(--color-muted)" }}>
          ({filtered.length})
        </span>
      </summary>

      <div className="px-3 pb-4">
        <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((it) => (
            <ItemCard key={`${it.category}-${it.id}`} item={it} />
          ))}
        </div>
      </div>
    </details>
  );
}

