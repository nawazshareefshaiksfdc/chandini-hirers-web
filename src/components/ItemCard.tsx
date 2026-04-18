"use client";

import Image from "next/image";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Item } from "@/types";
import { useCart } from "@/context/CartContext";

const QtyStepper = dynamic(() => import("./QtyStepper"), { ssr: false });

export default function ItemCard({ item }: { item: Item }) {
  const cart = useCart();
  const qty = cart.visibleQtyFor(item);
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = item.imageAssets || [];

  const handleNext = () => {
    if (images.length > 1) setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div
      className="flex w-full min-w-0 max-w-[200px] flex-col rounded-xl border p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <div
        className="relative flex h-[120px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl"
        style={{ backgroundColor: "var(--color-bg)" }}
        onClick={handleNext}
      >
        {images.length > 0 ? (
          <div className="relative h-full w-full">
            <Image
              src={images[currentIndex]}
              alt={item.name}
              fill
              className="select-none object-contain p-2"
              priority={false}
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs" style={{ color: "var(--color-muted)" }}>
            No image
          </div>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === currentIndex ? "bg-[color:var(--color-primary)]" : "bg-[color:var(--color-border)]"}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-grow flex-col justify-between text-center">
        <div className="min-h-[32px] line-clamp-2 text-[13px] font-semibold sm:text-sm">{item.name}</div>
        <div className="mt-1 text-[12px] font-semibold text-[color:var(--color-primary)]">₹ {item.price.toFixed(0)}</div>
      </div>

      <div className="mt-2">
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

