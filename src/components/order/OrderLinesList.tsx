"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { Trash2 } from "lucide-react";
// IMPORTANT: import your real Item type (has `category`)
import type { Item } from "@/types"; // if your barrel isn't set, use "@/types/index"

const QtyStepper = dynamic(() => import("@/components/QtyStepper"), { ssr: false });

type ItemLine = {
  item: Item;            // <-- use the real Item type so `category` is present
  qty: number;
  lineTotal: number;
};

type Props = {
  lines: ItemLine[];
  totalItems: number;
  totalAmount: number;
  onIncrement: (item: Item) => void;
  onDecrement: (item: Item) => void;
  onSetQty: (item: Item, qty: number) => void;
  onClearItem: (item: Item) => void;
};

export default function OrderLinesList({
  lines,
  totalItems,
  totalAmount,
  onIncrement,
  onDecrement,
  onSetQty,
  onClearItem,
}: Props) {
  if (lines.length === 0) {
    return <div className="text-center text-gray-400 py-16 text-sm">No items to preview</div>;
  }

  return (
    <div className="space-y-4">
      {lines.map((l) => (
        <div
          key={l.item.id}
          className="rounded-lg border border-gray-800 bg-[#141b2d] hover:bg-[#1a2236] transition px-2 py-2 sm:px-3 sm:py-2"
        >
          {/* Desktop */}
          <div className="hidden sm:flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative w-[85px] h-[85px] flex-shrink-0 overflow-hidden rounded-md bg-[#0f1625]">
                <Image
                  src={l.item.previewImage || l.item.imageAssets?.[0] || "/images/placeholder.jpeg"}
                  alt={l.item.name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <div className="font-medium text-white text-[15px] truncate leading-tight">
                  {l.item.name}
                </div>
                <div className="text-xs text-gray-400 leading-tight">
                  ₹{l.item.price.toFixed(0)} each
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              <QtyStepper
                value={l.qty}
                onAdd={() => onIncrement(l.item)}
                onRemove={() => onDecrement(l.item)}
                onSet={(q) => onSetQty(l.item, q)}
              />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-semibold text-[color:var(--color-primary)] text-sm whitespace-nowrap">
                ₹{l.lineTotal.toFixed(0)}
              </span>
              <button
                onClick={() => onClearItem(l.item)}
                className="p-1.5 rounded-md hover:bg-[#1e253c] text-gray-400 hover:text-white transition"
                title="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile */}
          <div className="sm:hidden grid grid-cols-[72px,1fr] gap-2">
            <div className="row-span-2 relative w-[72px] h-[72px] overflow-hidden rounded-md bg-[#0f1625]">
              <Image
                src={l.item.previewImage || l.item.imageAssets?.[0] || "/images/placeholder.jpeg"}
                alt={l.item.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="min-w-0">
              <div
                className="text-[13px] font-medium text-white leading-tight"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  wordBreak: "break-word",
                }}
              >
                {l.item.name}
              </div>
              <div className="text-[12px] text-gray-400 whitespace-nowrap">
                ₹{l.item.price.toFixed(0)} each
              </div>
            </div>

            <div className="col-start-2 flex items-center justify-between">
              <div className="-ml-1 scale-90 origin-left">
                <QtyStepper
                  value={l.qty}
                  onAdd={() => onIncrement(l.item)}
                  onRemove={() => onDecrement(l.item)}
                  onSet={(q) => onSetQty(l.item, q)}
                />
              </div>

              <span className="mx-2 inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#1d2440] text-[color:var(--color-primary)]">
                ₹{l.lineTotal.toFixed(0)}
              </span>

              <button
                onClick={() => onClearItem(l.item)}
                className="inline-flex items-center p-2 rounded-md bg-[#131a2f] text-gray-300 hover:bg-[#1e253c] transition"
                title="Remove item"
                aria-label={`Remove ${l.item.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="text-right px-2 sm:px-4 mt-2">
        <div className="text-sm text-gray-300">
          Total Items: <span className="font-medium text-white">{totalItems}</span>
        </div>
        <div className="text-sm text-gray-300">
          Total Amount:{" "}
          <span className="font-semibold text-[color:var(--color-primary)]">
            ₹{totalAmount.toFixed(0)}
          </span>
        </div>
      </div>
    </div>
  );
}
