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
    if (images.length > 1) setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div
      className="w-full min-w-[100px] max-w-[140px] rounded-xl border border-gray-700 shadow-sm p-2 flex flex-col bg-[color:var(--color-card)] hover:shadow-md transition-all duration-200 hover:border-[color:var(--color-primary)]"
    >
      {/* Image Section */}
      <div
        className="relative w-full h-[110px] flex justify-center items-center overflow-hidden rounded-lg bg-[#0f1629] cursor-pointer"
        onClick={handleNext}
      >
        {images.length > 0 ? (
          <div className="relative w-full h-full">
            <Image
              src={images[currentIndex]}
              alt={item.name}
              fill
              className="object-contain p-2 select-none"
              priority={false}
              unoptimized
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            No image
          </div>
        )}

        {/* Dots indicator only */}
        {images.length > 1 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i === currentIndex
                    ? "bg-[color:var(--color-primary)]"
                    : "bg-gray-500"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Item Info */}
      <div className="mt-2 text-center flex flex-col justify-between flex-grow">
        <div className="font-semibold text-[13px] sm:text-sm line-clamp-2 min-h-[32px] text-[color:var(--color-ink)]">
          {item.name}
        </div>
        <div className="text-[12px] font-medium text-green-400 mt-1">
          ₹{item.price.toFixed(0)}
        </div>
      </div>

      {/* Quantity Controls */}
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
