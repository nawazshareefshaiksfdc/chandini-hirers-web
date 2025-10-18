"use client";

import Image from "next/image";
import { useState } from "react";
import { Item } from "@/types";
import { useCart } from "@/context/CartContext";
import dynamic from "next/dynamic";

const QtyStepper = dynamic(() => import("./QtyStepper"), { ssr: false });

export default function ItemCard({ item }: { item: Item }) {
  const cart = useCart();
  const qty = cart.visibleQtyFor(item);
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = item.imageAssets || [];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div
      className="w-full min-w-[140px] max-w-full rounded-2xl border shadow-sm p-3 flex flex-col bg-[color:var(--color-card)] hover:shadow-md transition"
      onClick={images.length > 1 ? handleNext : undefined}
    >
      {/* Image Section */}
      <div className="relative w-full flex-1 flex justify-center items-center overflow-hidden rounded-lg cursor-pointer">
        {images.length > 0 && (
          <Image
            src={images[currentIndex]}
            width={200}
            height={140}
            alt={item.name}
            className="object-contain max-h-36 w-auto transition-transform duration-300"
            priority={false}
            unoptimized
          />
        )}

        {/* Dots indicator only */}
        {images.length > 1 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === currentIndex
                    ? "bg-[color:var(--color-primary)]"
                    : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Item Info */}
      <div className="mt-4 text-center">
        <div className="font-semibold text-sm sm:text-base truncate">{item.name}</div>
        <div className="text-sm text-[color:var(--secondary)] mt-1">
          ₹{item.price.toFixed(0)}
        </div>
      </div>

      {/* Quantity Controls */}
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
