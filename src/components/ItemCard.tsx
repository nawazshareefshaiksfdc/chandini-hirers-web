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
    <div className="w-full min-w-[140px] max-w-full rounded-2xl border shadow-sm p-3 flex flex-col bg-[color:var(--color-card)] hover:shadow-md transition">
      <div className="w-full flex-1 flex justify-center items-center">
        <Image
          src={item.imageAsset}
          width={200}
          height={140}
          alt={item.name}
          className="object-contain max-h-36 w-auto"
          priority={false}
          unoptimized
        />
      </div>

      <div className="mt-4 text-center">
        <div className="font-semibold text-sm sm:text-base truncate">{item.name}</div>
        <div className="text-sm text-[color:var(--secondary)] mt-1">₹{item.price.toFixed(0)}</div>
      </div>

      <div className="mt-4">
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
