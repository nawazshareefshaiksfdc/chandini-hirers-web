/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Trash2, Eye, EyeOff } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { kCatalog } from "@/data/catalog";
import {
  generateCartPdfBytes,
  preloadPdfFonts,
  arePdfFontsReady,
  didPdfFontsLoad,
  buildPdfFilename,
  robustDownloadPdf,
} from "@/utils/pdf";
import CustomerFormCard from "@/components/order/CustomerForm";
import type { CustomerForm } from "@/types/order";
import {
  emptyCustomerForm,
  coerceCustomerForm,
  validateCustomer,
} from "@/lib/validation/customer";

const QtyStepper = dynamic(() => import("@/components/QtyStepper"), { ssr: false });

const LOCAL_FORM_KEY = "chandini.order.customer.v2";
const LOCAL_SUBMITTED_KEY = "chandini.order.customer.submitted.v2";
const LOCAL_FORM_SHOW_KEY = "chandini.order.customer.show.v2";

/* ------- smooth scroll ------- */
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function smoothScrollToY(targetY: number, duration = 500) {
  try {
    const startY = window.scrollY || window.pageYOffset || 0;
    const distance = targetY - startY;
    const startTime = performance.now();
    function step(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeInOutCubic(t);
      window.scrollTo(0, startY + distance * eased);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  } catch {
    window.scrollTo(0, targetY);
  }
}

/* ✅ EXACT format: "14 DEC 2025 4: 20 PM" */
function formatChandiniDateTime(input?: string | Date | null) {
  if (!input) return "";
  const d = input instanceof Date ? input : new Date(input);

  // if parsing fails, return original string so you can debug
  if (Number.isNaN(d.getTime())) return typeof input === "string" ? input : "";

  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = d.getFullYear();

  let hrs = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, "0");
  const ampm = hrs >= 12 ? "PM" : "AM";
  hrs = hrs % 12;
  if (hrs === 0) hrs = 12;

  // ✅ space after ":" and AM/PM in caps
  return `${day} ${mon} ${year} ${hrs}: ${mins} ${ampm}`;
}

export default function PreviewPage() {
  const router = useRouter();
  const cart = useCart();
  const lines = cart.selectedLines;

  // PDF fonts
  const [fontReady, setFontReady] = useState(arePdfFontsReady());
  const [fontOk, setFontOk] = useState(didPdfFontsLoad());

  // Form state
  const [form, setForm] = useState<CustomerForm>(emptyCustomerForm);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(true);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  // Refs
  const formRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  // PDF preview
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const pdfObjectUrlRef = useRef<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const prevScrollYRef = useRef<number>(0);
  const pendingScrollToPreviewRef = useRef(false);

  // Catalog
  useEffect(() => {
    cart.syncCatalog(kCatalog);
  }, [cart]);

  // Fonts
  useEffect(() => {
    if (!fontReady) {
      preloadPdfFonts().then((ok) => {
        setFontReady(true);
        setFontOk(ok);
      });
    }
  }, [fontReady]);

  // Hydration
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_FORM_KEY);
      setForm(coerceCustomerForm(raw ? JSON.parse(raw) : null));
      const submitted = localStorage.getItem(LOCAL_SUBMITTED_KEY);
      const showSaved = localStorage.getItem(LOCAL_FORM_SHOW_KEY);
      if (showSaved === "true") setShowForm(true);
      if (showSaved === "false") setShowForm(false);
      if (submitted === "true") {
        setFormSubmitted(true);
        setEditing(false);
        setShowForm(true);
      }
      if (submitted !== "true" && showSaved == null) {
        const f = coerceCustomerForm(raw ? JSON.parse(raw) : null);
        if ((f.name || f.phone || f.address).trim()) {
          setShowForm(true);
          setEditing(true);
        }
      }
    } finally {
      setBootstrapped(true);
    }
  }, []);

  // Persist
  useEffect(() => {
    if (!bootstrapped) return;
    try {
      localStorage.setItem(LOCAL_FORM_KEY, JSON.stringify(form));
    } catch {}
  }, [form, bootstrapped]);

  useEffect(() => {
    if (!bootstrapped) return;
    try {
      localStorage.setItem(LOCAL_FORM_SHOW_KEY, showForm ? "true" : "false");
    } catch {}
  }, [showForm, bootstrapped]);

  // Scroll to preview on first show
  useEffect(() => {
    if (showPreview && pdfUrl && previewRef.current && pendingScrollToPreviewRef.current) {
      pendingScrollToPreviewRef.current = false;
      const top =
        (previewRef.current.getBoundingClientRect().top || 0) +
        (window.scrollY || window.pageYOffset) -
        12;
      smoothScrollToY(top, 600);
    }
  }, [showPreview, pdfUrl]);

  const revokePrevPdfUrl = () => {
    if (pdfObjectUrlRef.current) {
      URL.revokeObjectURL(pdfObjectUrlRef.current);
      pdfObjectUrlRef.current = null;
    }
  };

  function handleDelete() {
    if (!confirm("Delete this form? This cannot be undone.")) return;
    try {
      localStorage.removeItem(LOCAL_FORM_KEY);
      localStorage.removeItem(LOCAL_SUBMITTED_KEY);
      localStorage.setItem(LOCAL_FORM_SHOW_KEY, "true");
    } catch {}
    setForm(emptyCustomerForm);
    setFormSubmitted(false);
    setEditing(true);
    setShowForm(true);
    revokePrevPdfUrl();
    setPdfUrl(null);
    setShowPreview(false);
  }

  // ✅ formatted dates from DATA (not "now")
  const prettyStart = useMemo(() => formatChandiniDateTime(form.startDateTime), [form.startDateTime]);
  const prettyEnd = useMemo(() => formatChandiniDateTime(form.endDateTime), [form.endDateTime]);

  const whenText = useMemo(() => {
    if (prettyStart && prettyEnd) return `${prettyStart} to ${prettyEnd}`;
    return prettyStart || prettyEnd || "";
  }, [prettyStart, prettyEnd]);

  // PDF invalidation signature
  const pdfSignature = useMemo(
    () =>
      JSON.stringify({
        customer: {
          name: form.name,
          phone: form.phone,
          address: form.address,
          eventType: form.eventType,
          startDateTime: form.startDateTime,
          endDateTime: form.endDateTime,
          mapUrl: form.mapUrl,
        },
        totals: { items: cart.totalItems, amount: cart.totalAmount },
        lines: lines.map((l) => ({
          id: l.item.id,
          qty: l.qty,
          lineTotal: l.lineTotal,
          img: l.item.previewImage || l.item.imageAssets?.[0] || "/images/placeholder.jpeg",
        })),
      }),
    [
      form.name,
      form.phone,
      form.address,
      form.eventType,
      form.startDateTime,
      form.endDateTime,
      form.mapUrl,
      cart.totalItems,
      cart.totalAmount,
      lines,
    ]
  );

  // Rebuild preview when signature changes
  useEffect(() => {
    revokePrevPdfUrl();
    setPdfUrl(null);
    if (showPreview && lines.length > 0) {
      (async () => {
        const bytes = await generateCartPdfBytes({
          lines,
          totalItems: cart.totalItems,
          totalAmount: cart.totalAmount,
          customer: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            eventType: form.eventType || "",
            // ✅ PASS FORMATTED STRINGS
            startDateTime: prettyStart || "",
            endDateTime: prettyEnd || "",
            mapUrl: form.mapUrl || "",
          },
        });

        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        pdfObjectUrlRef.current = url;
        setPdfUrl(url);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfSignature]);

  const { valid: formValid } = useMemo(() => validateCustomer(form), [form]);

  const ensurePdfAndTogglePreview = async () => {
    if (lines.length === 0) return;

    if (!formValid) {
      setTimeout(() => {
        const y =
          (formRef.current?.getBoundingClientRect().top || 0) +
          (window.scrollY || window.pageYOffset) -
          16;
        smoothScrollToY(y, 500);
      }, 0);
      return;
    }

    if (showPreview) {
      setShowPreview(false);
      const targetY = prevScrollYRef.current || 0;
      requestAnimationFrame(() => smoothScrollToY(targetY, 550));
      return;
    }

    prevScrollYRef.current = window.scrollY || window.pageYOffset || 0;
    pendingScrollToPreviewRef.current = true;

    if (!pdfUrl) {
      const bytes = await generateCartPdfBytes({
        lines,
        totalItems: cart.totalItems,
        totalAmount: cart.totalAmount,
        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          eventType: form.eventType || "",
          // ✅ PASS FORMATTED STRINGS
          startDateTime: prettyStart || "",
          endDateTime: prettyEnd || "",
          mapUrl: form.mapUrl || "",
        },
      });
      const blob = new Blob([bytes], { type: "application/pdf" });
      revokePrevPdfUrl();
      const url = URL.createObjectURL(blob);
      pdfObjectUrlRef.current = url;
      setPdfUrl(url);
    }

    setShowPreview(true);
  };

  const handleOrderNow = async () => {
    if (lines.length === 0) return;

    if (!formValid) {
      setTimeout(() => {
        const y =
          (formRef.current?.getBoundingClientRect().top || 0) +
          (window.scrollY || window.pageYOffset) -
          16;
        smoothScrollToY(y, 500);
      }, 0);
      return;
    }

    try {
      localStorage.setItem(LOCAL_SUBMITTED_KEY, "true");
    } catch {}
    setFormSubmitted(true);

    const bytes = await generateCartPdfBytes({
      lines,
      totalItems: cart.totalItems,
      totalAmount: cart.totalAmount,
      customer: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        eventType: form.eventType || "",
        // ✅ PASS FORMATTED STRINGS
        startDateTime: prettyStart || "",
        endDateTime: prettyEnd || "",
        mapUrl: form.mapUrl || "",
      },
    });

    const filename = buildPdfFilename(form.name);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const file = new File([blob], filename, { type: "application/pdf" });

    const nav = navigator as any;
    if (nav.canShare?.({ files: [file] })) {
      try {
        await nav.share?.({
          title: "Chandini Hirers Order",
          text: `Order for ${form.name} (₹${cart.totalAmount.toFixed(0)})`,
          files: [file],
        });
        return;
      } catch {}
    }

    robustDownloadPdf(bytes, filename);

    // ✅ WhatsApp message uses formatted "When"
    const linesTxt = lines.map((l) => `• ${l.item.name} x ${l.qty} = ₹${l.lineTotal.toFixed(0)}`).join("%0A");
    const total = `Total: ₹${cart.totalAmount.toFixed(0)}`;

    const detail =
      `Name: ${encodeURIComponent(form.name)}%0A` +
      `Phone: ${encodeURIComponent(form.phone)}%0A` +
      `Event: ${encodeURIComponent(form.eventType)}%0A` +
      `When: ${encodeURIComponent(whenText)}%0A` +
      `Address: ${encodeURIComponent(form.address)}%0A` +
      (form.mapUrl ? `Map: ${encodeURIComponent(form.mapUrl)}%0A` : "");

    const waUrl = `https://wa.me/${encodeURIComponent(form.phone)}?text=${`Chandini Hirers - Order%0A%0A${linesTxt}%0A%0A${total}%0A%0A${detail}`}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleClearAll = () => {
    if (lines.length === 0) return;
    if (!confirm("Clear all selected items?")) return;
    cart.clear();
    revokePrevPdfUrl();
    setPdfUrl(null);
    setShowPreview(false);
    setForm(emptyCustomerForm);
    try {
      localStorage.removeItem(LOCAL_FORM_KEY);
      localStorage.removeItem(LOCAL_SUBMITTED_KEY);
      localStorage.setItem(LOCAL_FORM_SHOW_KEY, "true");
    } catch {}
    setFormSubmitted(false);
    setEditing(true);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 pb-56">
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

          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-white">Preview</h2>

            {/* ✅ SHOW DATA DATE/TIME in requested format */}
            {whenText ? (
              <div className="text-xs text-gray-400 leading-tight">
                {form.eventType ? (
                  <span className="mr-2">
                    Event: <span className="text-gray-300">{form.eventType}</span>
                  </span>
                ) : null}
                <span>
                  When: <span className="text-gray-300">{whenText}</span>
                </span>
              </div>
            ) : null}
          </div>
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
  <div className="text-center text-gray-400 py-16 text-sm">No items to preview</div>
) : (
  <div className="space-y-4">
    {lines.map((l) => (
      <div
        key={l.item.id}
        className="relative overflow-hidden rounded-lg border border-gray-800 bg-[#141b2d] hover:bg-[#1a2236] transition px-2 py-2 sm:px-3 sm:py-2"
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
              onAdd={() => cart.increment(l.item)}
              onRemove={() => cart.decrement(l.item)}
              onSet={(q) => cart.setQty(l.item, q)}
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="font-semibold text-[color:var(--color-primary)] text-sm whitespace-nowrap">
              ₹{l.lineTotal.toFixed(0)}
            </span>
            <button
              onClick={() => cart.clearItem(l.item)}
              className="p-1.5 rounded-md hover:bg-[#1e253c] text-gray-400 hover:text-white transition"
              title="Remove item"
              aria-label={`Remove ${l.item.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
       
        {/* Mobile */}
<div className="sm:hidden grid grid-cols-[72px,1fr] gap-2">
  {/* Image */}
  <div className="row-span-3 relative w-[72px] h-[72px] overflow-hidden rounded-md bg-[#0f1625]">
    <Image
      src={l.item.previewImage || l.item.imageAssets?.[0] || "/images/placeholder.jpeg"}
      alt={l.item.name}
      fill
      className="object-cover"
      unoptimized
    />
  </div>

  {/* Title + Total price (adjacent) */}
  <div className="min-w-0 flex items-start justify-between gap-2">
    <div
      className="min-w-0 text-[13px] font-medium text-white leading-tight"
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

    <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#1d2440] text-[color:var(--color-primary)]">
      ₹{l.lineTotal.toFixed(0)}
    </span>
  </div>

  {/* Unit price (below title) */}
  <div className="col-start-2 text-[12px] text-gray-400 whitespace-nowrap -mt-1">
    ₹{l.item.price.toFixed(0)} each
  </div>

  {/* QtyStepper + Delete (adjacent) */}
  <div className="col-start-2 flex items-center justify-between gap-2">
    <div className="-ml-1 scale-90 origin-left shrink-0">
      <QtyStepper
        value={l.qty}
        onAdd={() => cart.increment(l.item)}
        onRemove={() => cart.decrement(l.item)}
        onSet={(q) => cart.setQty(l.item, q)}
      />
    </div>

    <button
      onClick={() => cart.clearItem(l.item)}
      className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-[#131a2f] text-gray-300 hover:bg-[#1e253c] transition shrink-0"
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
        Total Items: <span className="font-medium text-white">{cart.totalItems}</span>
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



      {/* Customer Form */}
      {lines.length > 0 && (
        <div ref={formRef} className="mt-4">
          <CustomerFormCard
            value={form}
            onChange={setForm}
            editing={editing}
            showHeader
            onEdit={() => setEditing(true)}
            onDelete={handleDelete}
            onSubmit={() => {
              try {
                localStorage.setItem(LOCAL_SUBMITTED_KEY, "true");
              } catch {}
              setFormSubmitted(true);
              setEditing(false);
              setShowForm(true);
            }}
          />

          {/* PDF Preview */}
          {pdfUrl && showPreview && (
            <div ref={previewRef} id="pdf-preview" className="mt-4">
              <h4 className="text-white font-medium mb-2">PDF Preview</h4>
              <iframe src={pdfUrl} className="w-full h-[70vh] rounded-lg border border-gray-800 bg-[#0c1323]" />
            </div>
          )}
        </div>
      )}

      {/* Footer — two buttons */}
      <div className="fixed inset-x-0 bottom-0 bg-[color:var(--color-card)] border-t border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            className="inline-flex items-center justify-center gap-2 border border-gray-700 rounded-xl py-3 text-gray-300 hover:border-[color:var(--color-primary)] hover:text-white transition disabled:opacity-40"
            onClick={ensurePdfAndTogglePreview}
            disabled={lines.length === 0}
            title={!formValid ? "Fill the customer form to preview" : showPreview ? "Hide Preview" : "Preview PDF"}
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? "Hide Preview" : "Preview PDF"}
          </button>

          <button
            className="bg-[color:var(--color-primary)] text-white rounded-xl py-3 hover:saturate-125 transition disabled:opacity-40"
            onClick={handleOrderNow}
            disabled={lines.length === 0}
            title="Order Now"
          >
            Order Now
          </button>
        </div>
      </div>
    </main>
  );
}
