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
  const filtered = items.filter((it) => it.category === category);

  if (filtered.length === 0) return null;
  return (
    <details className="rounded-2xl border shadow-sm bg-[color:var(--color-card)]" open>
      <summary className="cursor-pointer select-none py-3 px-4 font-semibold text-[color:var(--color-primary)]">
        {category}
        <span className="ml-2 text-xs opacity-60">({filtered.length})</span>
      </summary>

      <div className="px-3 pb-4">
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 auto-rows-fr">
          {filtered.map((it) => (
            <ItemCard key={it.id} item={it} />
          ))}
        </div>
      </div>
    </details>
  );
}

