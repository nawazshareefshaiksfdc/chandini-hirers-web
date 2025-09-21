"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { kCatalog } from "@/data/catalog";
import {
  generateCartPdfBytes,
  robustDownloadPdf,
  preloadPdfFonts,
  arePdfFontsReady,
  didPdfFontsLoad,
} from "@/utils/pdf";

type NavigatorWebShare = Navigator & {
  canShare?: (data: ShareData & { files?: File[] }) => boolean;
  share?: (data: ShareData & { files?: File[] }) => Promise<void>;
};

export default function PreviewPage() {
  const cart = useCart();

  // include `cart` in deps to satisfy ESLint rule
  useEffect(() => {
    cart.syncCatalog(kCatalog);
  }, []);

  const lines = cart.selectedLines;

  // ---- FONT GATE ----
  const [fontReady, setFontReady] = useState(arePdfFontsReady());
  const [fontOk, setFontOk] = useState(didPdfFontsLoad());

  useEffect(() => {
    if (!fontReady) {
      preloadPdfFonts().then((ok) => {
        setFontReady(true);
        setFontOk(ok);
      });
    }
  }, [fontReady]);

  // ---- PDF preview state (on-demand) ----
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showInline, setShowInline] = useState(false);
  const urlRef = useRef<string | null>(null);
  const [building, setBuilding] = useState(false);

  const buildPdfUrl = async () => {
    if (lines.length === 0) {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
      setPdfUrl(null);
      return;
    }
    setBuilding(true);
    try {
      const bytes = await generateCartPdfBytes({
        lines,
        totalItems: cart.totalItems,
        totalAmount: cart.totalAmount,
      });
      const blob = new Blob([bytes], { type: "application/pdf" });
      const nextUrl = URL.createObjectURL(blob);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = nextUrl;
      setPdfUrl(nextUrl);
    } finally {
      setBuilding(false);
    }
  };

  // Rebuild when data changes, but only if user asked & fonts OK
  const depsKey = useMemo(
    () =>
      JSON.stringify({
        c: lines.map((l) => ({ id: l.item.id, q: l.qty })),
        t: cart.totalItems,
        a: Math.round(cart.totalAmount),
      }),
    [lines, cart.totalItems, cart.totalAmount]
  );

  useEffect(() => {
    if (!showInline || !fontOk) return;
    const id = setTimeout(buildPdfUrl, 150);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey, showInline, fontOk]);

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  // ---- Actions ----
  const handleShowInline = async () => {
    setShowInline(true);
    await buildPdfUrl();
  };

  const handleOpenSameTab = async () => {
    if (!pdfUrl) await buildPdfUrl();
    const url = urlRef.current || pdfUrl;
    if (url) window.location.assign(url); // same tab → Back returns here
  };

  const handleDownloadPdf = async () => {
    if (lines.length === 0) {
      alert("No items to download");
      return;
    }
    const bytes = await generateCartPdfBytes({
      lines,
      totalItems: cart.totalItems,
      totalAmount: cart.totalAmount,
    });
    robustDownloadPdf(bytes, `order_${Date.now()}.pdf`);
  };

  const handleShare = async () => {
    if (lines.length === 0) {
      alert("No items selected");
      return;
    }
    const bytes = await generateCartPdfBytes({
      lines,
      totalItems: cart.totalItems,
      totalAmount: cart.totalAmount,
    });
    const blob = new Blob([bytes], { type: "application/pdf" });
    const filename = `order_${Date.now()}.pdf`;
    const file = new File([blob], filename, { type: "application/pdf" });

    const shareText = `Order from Chandini Hirers
Items: ${cart.totalItems}
Total: ₹${cart.totalAmount.toFixed(0)}
Attached: PDF summary.`;

    const nav = navigator as NavigatorWebShare;
    if (nav.canShare?.({ files: [file] })) {
      try {
        await nav.share?.({ title: "Chandini Hirers Order", text: shareText, files: [file] });
        return;
      } catch (_err: unknown) {
        // fall through to download
      }
    }
    robustDownloadPdf(bytes, filename);
  };

  const handleClearAll = () => {
    if (lines.length === 0) return;
    const ok = confirm("Clear all selected items?");
    if (!ok) return;
    cart.clear();
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setPdfUrl(null);
    setShowInline(false);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 pb-28">
      <header className="py-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Preview</h2>
        <button
          className="text-sm border rounded-lg px-3 py-1.5 disabled:opacity-50"
          onClick={handleClearAll}
          disabled={lines.length === 0}
          title={lines.length === 0 ? "Nothing to clear" : "Remove all selected items"}
        >
          Clear All
        </button>
      </header>

      {/* Items */}
      {lines.length === 0 ? (
        <div className="text-center text-gray-600 py-12">No items to preview</div>
      ) : (
        <div className="space-y-4">
          <div className="font-semibold">Items</div>
          <ul className="divide-y border rounded-xl bg-white">
            {lines.map((l) => (
              <li key={l.item.id} className="flex items-center gap-3 p-3">
                <Image
                  src={l.item.imageAsset}
                  width={48}
                  height={48}
                  alt={l.item.name}
                  className="h-12 w-12 object-contain"
                />
                <div className="flex-1">
                  <div className="font-medium">{l.item.name}</div>
                  <div className="text-sm text-gray-600">
                    Qty: {l.qty} • ₹{l.item.price.toFixed(0)} each
                  </div>
                </div>
                <div className="font-semibold">₹{l.lineTotal.toFixed(0)}</div>
              </li>
            ))}
          </ul>

          {!fontReady && <div className="text-sm text-gray-600">Loading PDF fonts to display ₹ correctly…</div>}
          {fontReady && !fontOk && (
            <div className="text-sm text-red-600">
              Couldn’t load PDF fonts; preview is disabled to avoid broken ₹. You can still Download/Share.
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              className="border rounded-xl px-3 py-2 disabled:opacity-50"
              onClick={handleShowInline}
              disabled={!fontReady || !fontOk || showInline}
              title={!fontReady ? "Loading fonts…" : !fontOk ? "Fonts failed to load" : "Show PDF inline"}
            >
              {showInline ? "Preview Shown" : "Show PDF inline"}
            </button>
            <button
              className="border rounded-xl px-3 py-2 disabled:opacity-50"
              onClick={handleOpenSameTab}
              disabled={!fontReady || !fontOk}
              title={!fontReady ? "Loading fonts…" : !fontOk ? "Fonts failed to load" : "Open the PDF in this tab"}
            >
              Open PDF (same tab)
            </button>
          </div>

          {showInline && fontOk && (
            <div className="border rounded-xl bg-white overflow-hidden">
              {building ? (
                <div className="p-6 text-sm text-gray-600">Building preview…</div>
              ) : pdfUrl ? (
                <iframe key={pdfUrl} src={pdfUrl} className="w-full h-[70vh]" title="Order PDF Preview" />
              ) : (
                <div className="p-6 text-sm text-gray-600">No preview yet.</div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 bg-white border-t">
        <div className="max-w-5xl mx-auto px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* <button
            className="border rounded-xl py-3 disabled:opacity-50"
            onClick={handleClearAll}
            disabled={lines.length === 0}
          >
            Clear All
          </button> */}
          <button className="border rounded-xl py-3 disabled:opacity-50 text-gray-400" onClick={handleDownloadPdf} disabled={lines.length === 0}>
            Download PDF
          </button>
          <button className="bg-green-600 text-white rounded-xl py-3 disabled:opacity-50" onClick={handleShare} disabled={lines.length === 0}>
            Order Now
          </button>
        </div>
      </div>
    </main>
  );
}
