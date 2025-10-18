/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { kCatalog } from "@/data/catalog";
import {
  generateCartPdfBytes,
  robustDownloadPdf,
  preloadPdfFonts,
  arePdfFontsReady,
  didPdfFontsLoad,
} from "@/utils/pdf";
import { ArrowLeft, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";

const QtyStepper = dynamic(() => import("@/components/QtyStepper"), { ssr: false });

export default function PreviewPage() {
  const router = useRouter();
  const cart = useCart();
  const lines = cart.selectedLines;

  const [fontReady, setFontReady] = useState(arePdfFontsReady());
  const [fontOk, setFontOk] = useState(didPdfFontsLoad());
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    cart.syncCatalog(kCatalog);
  }, [cart]);

  useEffect(() => {
    if (!fontReady) {
      preloadPdfFonts().then((ok) => {
        setFontReady(true);
        setFontOk(ok);
      });
    }
  }, [fontReady]);

  const handleDownloadPdf = async () => {
    if (lines.length === 0) return;
    const bytes = await generateCartPdfBytes({
      lines,
      totalItems: cart.totalItems,
      totalAmount: cart.totalAmount,
    });
    robustDownloadPdf(bytes, `order_${Date.now()}.pdf`);
  };

  const handleShare = async () => {
    if (lines.length === 0) return;
    const bytes = await generateCartPdfBytes({
      lines,
      totalItems: cart.totalItems,
      totalAmount: cart.totalAmount,
    });
    const blob = new Blob([bytes], { type: "application/pdf" });
    const filename = `order_${Date.now()}.pdf`;
    const file = new File([blob], filename, { type: "application/pdf" });

    const nav = navigator as any;
    if (nav.canShare?.({ files: [file] })) {
      await nav.share?.({
        title: "Chandini Hirers Order",
        text: `Order Summary\nTotal: ₹${cart.totalAmount.toFixed(0)}`,
        files: [file],
      });
    } else {
      robustDownloadPdf(bytes, filename);
    }
  };

  const handleClearAll = () => {
    if (lines.length === 0) return;
    if (confirm("Clear all selected items?")) cart.clear();
  };

  return (
    <main className="max-w-5xl mx-auto px-4 pb-28">
      {/* Header */}
      <header className="py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border text-sm font-medium text-[color:var(--color-primary)] border-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)] hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          <h2 className="text-xl font-semibold text-white">Preview</h2>
        </div>
        <button
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:border-[color:var(--color-primary)] hover:text-white transition disabled:opacity-40"
          onClick={handleClearAll}
          disabled={lines.length === 0}
        >
          Clear All
        </button>
      </header>

      {/* Items */}
      {lines.length === 0 ? (
        <div className="text-center text-gray-400 py-16 text-sm">
          No items to preview
        </div>
      ) : (
        <div className="space-y-2">
          {lines.map((l) => (
            <div
              key={l.item.id}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[#141b2d] hover:bg-[#1a2236] transition border border-gray-800"
            >
              {/* Left: Image + Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative w-[85px] h-[85px] flex-shrink-0 overflow-hidden rounded-md bg-[#0f1625]">
                  <Image
                    src={
                      l.item.previewImage ||
                      l.item.imageAssets?.[0] ||
                      "/images/placeholder.jpeg"
                    }
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

              {/* Qty Stepper */}
              <div className="flex-shrink-0">
                <QtyStepper
                  value={l.qty}
                  onAdd={() => cart.increment(l.item)}
                  onRemove={() => cart.decrement(l.item)}
                  onSet={(q) => cart.setQty(l.item, q)}
                />
              </div>

              {/* Price + Delete */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-semibold text-[color:var(--color-primary)] text-sm whitespace-nowrap">
                  ₹{l.lineTotal.toFixed(0)}
                </span>
                <button
                  onClick={() => cart.clearItem(l.item)}
                  className="p-1.5 rounded-md hover:bg-[#1e253c] text-gray-400 hover:text-white transition"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Totals */}
          <div className="text-right px-2 sm:px-4 mt-3">
            <div className="text-sm text-gray-300">
              Total Items:{" "}
              <span className="font-medium text-white">{cart.totalItems}</span>
            </div>
            <div className="text-sm text-gray-300">
              Total Amount:{" "}
              <span className="font-semibold text-[color:var(--color-primary)]">
                ₹{cart.totalAmount.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="fixed inset-x-0 bottom-0 bg-[color:var(--color-card)] border-t border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            className="border border-gray-700 rounded-xl py-3 text-gray-300 hover:border-[color:var(--color-primary)] hover:text-white transition disabled:opacity-40"
            onClick={handleDownloadPdf}
            disabled={lines.length === 0}
          >
            Download PDF
          </button>
          <button
            className="bg-[color:var(--color-primary)] text-white rounded-xl py-3 hover:brightness-110 transition disabled:opacity-40"
            onClick={handleShare}
            disabled={lines.length === 0}
          >
            Order Now
          </button>
        </div>
      </div>
    </main>
  );
}
