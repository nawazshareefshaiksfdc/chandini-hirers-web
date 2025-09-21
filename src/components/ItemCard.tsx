"use client";

import Image from "next/image";
import { Item } from "@/types";
import { useCart } from "@/context/CartContext";
import dynamic from "next/dynamic";
const QtyStepper = dynamic(() => import("./QtyStepper"), { ssr: false });

export default function ItemCard({ item }: { item: Item }) {
  const cart = useCart();
  const qty = cart.visibleQtyFor(item);

  return (
<div className="rounded-2xl border shadow-sm p-3 flex flex-col bg-[color:var(--color-card)] hover:shadow-md transition">
  <div className="flex-1 grid place-items-center">
        <Image
          src={item.imageAsset}
          width={220}
          height={160}
          alt={item.name}
          className="object-contain h-40 w-auto"
          priority={false}
          unoptimized   
        />
      </div>
  <div className="mt-2">
    <div className="font-semibold truncate">{item.name}</div>
    <div className="text-sm text-[color:var(--color-primary)]">₹{item.price.toFixed(0)}</div>
  </div>

      <div className="mt-3">
        <QtyStepper
          value={qty}
          onAdd={() => cart.increment(item)}
          onRemove={() => cart.decrement(item)}
          onSet={(q) => cart.setQty(item, q)}
          onClear={() => cart.clearItem(item)}
        />
      </div>
    </div>
  );
}
