"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { Trash2 } from "lucide-react";
import type { Item } from "@/types";

const QtyStepper = dynamic(() => import("@/components/QtyStepper"), { ssr: false });

type ItemLine = {
  item: Item;
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
    return <div className="py-16 text-center text-sm" style={{ color: "var(--color-muted)" }}>No items to preview</div>;
  }

  return (
    <div className="space-y-4">
      {lines.map((l) => (
        <div
          key={l.item.id}
          className="rounded-xl border px-2 py-2 transition-all duration-200 sm:px-3"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <div className="hidden items-center justify-between gap-3 sm:flex">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="relative h-[85px] w-[85px] flex-shrink-0 overflow-hidden rounded-md" style={{ backgroundColor: "var(--color-bg)" }}>
                <Image
                  src={l.item.previewImage || l.item.imageAssets?.[0] || "/images/placeholder.jpeg"}
                  alt={l.item.name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="flex min-w-0 flex-col justify-center">
                <div className="truncate text-[15px] font-medium leading-tight">{l.item.name}</div>
                <div className="text-xs leading-tight" style={{ color: "var(--color-muted)" }}>₹{l.item.price.toFixed(0)} each</div>
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

            <div className="flex flex-shrink-0 items-center gap-2">
              <span className="whitespace-nowrap text-sm font-semibold text-[color:var(--color-primary)]">₹{l.lineTotal.toFixed(0)}</span>
              <button
                onClick={() => onClearItem(l.item)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200"
                style={{ color: "var(--color-muted)" }}
                title="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[72px,1fr] gap-2 sm:hidden">
            <div className="relative row-span-2 h-[72px] w-[72px] overflow-hidden rounded-md" style={{ backgroundColor: "var(--color-bg)" }}>
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
                className="text-[13px] font-medium leading-tight"
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
              <div className="whitespace-nowrap text-[12px]" style={{ color: "var(--color-muted)" }}>₹{l.item.price.toFixed(0)} each</div>
            </div>

            <div className="col-start-2 flex items-center justify-between">
              <div className="-ml-1 origin-left scale-90">
                <QtyStepper
                  value={l.qty}
                  onAdd={() => onIncrement(l.item)}
                  onRemove={() => onDecrement(l.item)}
                  onSet={(q) => onSetQty(l.item, q)}
                />
              </div>

              <span
                className="mx-2 inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold"
                style={{ backgroundColor: "var(--color-primary-weak)", color: "var(--color-primary)" }}
              >
                ₹{l.lineTotal.toFixed(0)}
              </span>

              <button
                onClick={() => onClearItem(l.item)}
                className="inline-flex items-center rounded-lg p-2 transition-all duration-200"
                style={{ backgroundColor: "var(--color-bg)", color: "var(--color-muted)" }}
                title="Remove item"
                aria-label={`Remove ${l.item.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="mt-2 space-y-1 px-2 text-right sm:px-4">
        <div className="text-sm" style={{ color: "var(--color-muted)" }}>
          Total Items: <span className="font-medium" style={{ color: "var(--color-text)" }}>{totalItems}</span>
        </div>
        <div className="text-sm" style={{ color: "var(--color-muted)" }}>
          Total Amount: <span className="font-semibold text-[color:var(--color-primary)]">₹{totalAmount.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}
