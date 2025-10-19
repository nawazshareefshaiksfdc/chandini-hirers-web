/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Trash2, Pencil, X, Eye, EyeOff } from "lucide-react";
import dynamic from "next/dynamic";
const QtyStepper = dynamic(() => import("@/components/QtyStepper"), { ssr: false });
type CustomerForm = {
  name: string;
  phone: string;   // digits only; include country code e.g. 9198XXXXXXXX (no '+')
  address: string;
};
const LOCAL_FORM_KEY = "chandini.order.customer.v1";
const LOCAL_SUBMITTED_KEY = "chandini.order.customer.submitted.v1";
const LOCAL_FORM_SHOW_KEY = "chandini.order.customer.show.v1";
// ------- cross-browser smooth scroll util -------
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
export default function PreviewPage() {
  const router = useRouter();
  const cart = useCart();
  const lines = cart.selectedLines;
  // PDF fonts state
  const [fontReady, setFontReady] = useState(arePdfFontsReady());
  const [fontOk, setFontOk] = useState(didPdfFontsLoad());
  // Bootstrapping guard (prevents writing empty defaults over saved data)
  const [bootstrapped, setBootstrapped] = useState(false);
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(true);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formTouched, setFormTouched] = useState(false);
  const [form, setForm] = useState<CustomerForm>({ name: "", phone: "", address: "" });
  const formRef = useRef<HTMLDivElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  // PDF preview
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const pdfObjectUrlRef = useRef<string | null>(null);
  // near your other refs
  // refs (near your other refs)
  const previewRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollToPreviewRef = useRef(false);
  // when the preview section becomes visible for the first time, scroll to it
  useEffect(() => {
    if (showPreview && pdfUrl && previewRef.current && pendingScrollToPreviewRef.current) {
      pendingScrollToPreviewRef.current = false; // consume the intent
      const top =
        (previewRef.current.getBoundingClientRect().top || 0) +
        (window.scrollY || window.pageYOffset) -
        12; // small padding
      smoothScrollToY(top, 600);
    }
  }, [showPreview, pdfUrl]);
  // Build a stable signature of data that affects the PDF
  const pdfSignature = JSON.stringify({
    customer: { name: form.name, phone: form.phone, address: form.address },
    totals: { items: cart.totalItems, amount: cart.totalAmount },
    lines: lines.map((l) => ({
      id: l.item.id,
      qty: l.qty,
      lineTotal: l.lineTotal,
      img: l.item.previewImage || l.item.imageAssets?.[0] || "/images/placeholder.jpeg",
    })),
  });
  // Invalidate (and optionally rebuild) preview when signature changes
  useEffect(() => {
    revokePrevPdfUrl();
    setPdfUrl(null);
    const rebuild = async () => {
      const bytes = await generateCartPdfBytes({
        lines,
        totalItems: cart.totalItems,
        totalAmount: cart.totalAmount,
        customer: { name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim() },
      });
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      pdfObjectUrlRef.current = url;
      setPdfUrl(url);
    };
    if (showPreview && lines.length > 0) {
      void rebuild();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfSignature]);
  // remember scrollY to return after hiding preview
  const prevScrollYRef = useRef<number>(0);
  // Sync catalog
  useEffect(() => {
    cart.syncCatalog(kCatalog);
  }, [cart]);
  // Load fonts once
  useEffect(() => {
    if (!fontReady) {
      preloadPdfFonts().then((ok) => {
        setFontReady(true);
        setFontOk(ok);
      });
    }
  }, [fontReady]);
  // ===== INITIAL HYDRATION (read once, then allow writes) =====
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_FORM_KEY);
      if (raw) setForm(JSON.parse(raw) as CustomerForm);
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
        const f = raw ? (JSON.parse(raw) as CustomerForm) : { name: "", phone: "", address: "" };
        if (f.name?.trim() || f.phone?.trim() || f.address?.trim()) {
          setShowForm(true);
          setEditing(true);
        }
      }
    } finally {
      // only after we have read from storage, we allow writers to run
      setBootstrapped(true);
    }
  }, []);
  // Persist form to cache — but ONLY after bootstrapped
  useEffect(() => {
    if (!bootstrapped) return;
    try {
      localStorage.setItem(LOCAL_FORM_KEY, JSON.stringify(form));
    } catch { }
  }, [form, bootstrapped]);
  // Persist show/hide flag — but ONLY after bootstrapped
  useEffect(() => {
    if (!bootstrapped) return;
    try {
      localStorage.setItem(LOCAL_FORM_SHOW_KEY, showForm ? "true" : "false");
    } catch { }
  }, [showForm, bootstrapped]);
  // Rehydrate on bfcache restore and cross-tab storage changes
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_FORM_KEY || e.key === LOCAL_SUBMITTED_KEY || e.key === LOCAL_FORM_SHOW_KEY) {
        try {
          const raw = localStorage.getItem(LOCAL_FORM_KEY);
          if (raw) setForm(JSON.parse(raw) as CustomerForm);
          const submitted = localStorage.getItem(LOCAL_SUBMITTED_KEY);
          setFormSubmitted(submitted === "true");
          const showSaved = localStorage.getItem(LOCAL_FORM_SHOW_KEY);
          if (showSaved === "true") setShowForm(true);
          if (showSaved === "false") setShowForm(false);
        } catch { }
      }
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if ((e as any).persisted) {
        try {
          const raw = localStorage.getItem(LOCAL_FORM_KEY);
          if (raw) setForm(JSON.parse(raw) as CustomerForm);
          const submitted = localStorage.getItem(LOCAL_SUBMITTED_KEY);
          setFormSubmitted(submitted === "true");
          const showSaved = localStorage.getItem(LOCAL_FORM_SHOW_KEY);
          if (showSaved === "true") setShowForm(true);
          if (showSaved === "false") setShowForm(false);
        } catch { }
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);
  // ========= UI helpers =========
  const uiFieldClass = (isInvalid: boolean, isEditing: boolean) => {
    const base = "w-full px-3 py-2 rounded-md bg-[#0c1323] border text-sm outline-none pr-10 focus:ring-1 ";
    const state = isInvalid
      ? "border-amber-400 text-amber-100 placeholder-amber-200 focus:ring-amber-400 bg-amber-500/5"
      : "border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-[color:var(--color-primary)]";
    const lock = isEditing ? "" : " opacity-60 cursor-not-allowed";
    return base + state + lock;
  };
  const formValid =
    form.name.trim().length >= 2 &&
    /^\d{10,15}$/.test(form.phone.trim()) &&
    form.address.trim().length >= 6;
  const scrollFormIntoView = () => {
    setTimeout(() => {
      const y =
        (formRef.current?.getBoundingClientRect().top || 0) +
        (window.scrollY || window.pageYOffset || 0) -
        16;
      smoothScrollToY(y, 500);
      setTimeout(() => {
        if (editing) firstInputRef.current?.focus();
      }, 300);
    }, 0);
  };
  const revokePrevPdfUrl = () => {
    if (pdfObjectUrlRef.current) {
      URL.revokeObjectURL(pdfObjectUrlRef.current);
      pdfObjectUrlRef.current = null;
    }
  };
  const buildOrderSummaryText = () => {
    const itemLines = lines
      .map((l) => `• ${l.item.name} x ${l.qty} = ₹${l.lineTotal.toFixed(0)}`)
      .join("%0A");
    const total = `Total: ₹${cart.totalAmount.toFixed(0)}`;
    const customer = `Name: ${encodeURIComponent(form.name)}%0APhone: ${encodeURIComponent(
      form.phone
    )}%0AAddress: ${encodeURIComponent(form.address)}`;
    return `Chandini Hirers - Order%0A%0A${itemLines}%0A%0A${total}%0A%0A${customer}`;
  };
  // Field clear helpers
  const clearName = () => setForm((s) => ({ ...s, name: "" }));
  const clearPhone = () => setForm((s) => ({ ...s, phone: "" }));
  const clearAddress = () => setForm((s) => ({ ...s, address: "" }));
  // ===== Actions =====
  const ensurePdfAndTogglePreview = async () => {
    if (lines.length === 0) return;
    setFormTouched(true);
    if (!formValid) {
      if (!showForm) setShowForm(true);
      setEditing(true);
      scrollFormIntoView();
      return;
    }
    if (showPreview) {
      setShowPreview(false);
      const targetY = prevScrollYRef.current || 0;
      requestAnimationFrame(() => smoothScrollToY(targetY, 550));
      return;
    }
    // remember position before opening
    prevScrollYRef.current = window.scrollY || window.pageYOffset || 0;
    // mark that, once the preview shows up, we should scroll to it
    pendingScrollToPreviewRef.current = true;
    // ensure pdfUrl exists; it's async the first time
    if (!pdfUrl) {
      const bytes = await generateCartPdfBytes({
        lines,
        totalItems: cart.totalItems,
        totalAmount: cart.totalAmount,
        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
        },
      });
      const blob = new Blob([bytes], { type: "application/pdf" });
      revokePrevPdfUrl();
      const url = URL.createObjectURL(blob);
      pdfObjectUrlRef.current = url;
      setPdfUrl(url);
    }
    // show preview; the effect above will handle the first-time scroll
    setShowPreview(true);
  };

  const handleOrderNow = async () => {
    if (lines.length === 0) return;
    setFormTouched(true);
    if (!formValid) {
      setShowForm(true);
      setEditing(true);
      scrollFormIntoView();
      return;
    }
    try {
      localStorage.setItem(LOCAL_SUBMITTED_KEY, "true");
    } catch { }
    setFormSubmitted(true);
    const bytes = await generateCartPdfBytes({
      lines,
      totalItems: cart.totalItems,
      totalAmount: cart.totalAmount,
      customer: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      },
    });
    // Build a nice filename like "chandini-19:20:25-23:54.pdf"
    const filename = buildPdfFilename(form.name);
    // If the device supports native share with file, try that first
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
      } catch {
      }
    }
    // ✅ Download fallback with your custom filename
    robustDownloadPdf(bytes, buildPdfFilename(form.name));
    // (Optional) Also open WhatsApp text share as before:
    const phone = form.phone.trim();
    const summary = buildOrderSummaryText();
    const waUrl = `https://wa.me/${phone}?text=${summary}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };
  const handleClearAll = () => {
    if (lines.length === 0) return;
    if (confirm("Clear all selected items?")) {
      cart.clear();
      revokePrevPdfUrl();
      setPdfUrl(null);
      setShowPreview(false);
    }
  };
  const handleEditDetails = () => {
    setShowForm(true);
    setEditing(true);
    setFormTouched(false);
    setTimeout(() => firstInputRef.current?.focus(), 100);
  };
  // const handleDeleteDetails = () => {
  //   if (!confirm("Delete saved customer details?")) return;
  //   try {
  //     localStorage.removeItem(LOCAL_FORM_KEY);
  //     localStorage.removeItem(LOCAL_SUBMITTED_KEY);
  //   } catch {}
  //   setForm({ name: "", phone: "", address: "" });
  //   setFormSubmitted(false);
  //   setShowForm(true);
  //   setEditing(true);
  //   setFormTouched(false);
  //   setTimeout(() => firstInputRef.current?.focus(), 100);
  // };
  const handleDeleteDetails = () => {
    if (!confirm("Delete saved customer details?")) return;
    try {
      localStorage.removeItem(LOCAL_FORM_KEY);
      localStorage.removeItem(LOCAL_SUBMITTED_KEY);
      // persist that the form should be hidden going forward
      localStorage.setItem(LOCAL_FORM_SHOW_KEY, "false");
    } catch { }
    // clear state
    setForm({ name: "", phone: "", address: "" });
    setFormSubmitted(false);
    setEditing(false);
    // HIDE the form immediately
    setShowForm(false);
    // don't focus anything; we just removed the form
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
        <div className="text-center text-gray-400 py-16 text-sm">No items to preview</div>
      ) : (
        <div className="space-y-4">
          {lines.map((l) => (
            <div
              key={l.item.id}
              className="rounded-lg border border-gray-800 bg-[#141b2d] hover:bg-[#1a2236] transition px-2 py-2 sm:px-3 sm:py-2"
            >

              {/* ===== Desktop layout (UNCHANGED) ===== */}
              <div className="hidden sm:flex items-center justify-between gap-3">
                {/* Left: Image + Info */}
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
              {/* ===== Mobile layout (2 cols: image | details) ===== */}
              <div className="sm:hidden grid grid-cols-[72px,1fr] gap-2">
                {/* Left column: image spans both rows */}
                <div className="row-span-2 relative w-[72px] h-[72px] overflow-hidden rounded-md bg-[#0f1625]">
                  <Image
                    src={l.item.previewImage || l.item.imageAssets?.[0] || "/images/placeholder.jpeg"}
                    alt={l.item.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* Right col — Row 1: name (2-line clamp) + unit price below */}
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

                {/* Right col — Row 2: qty stepper + line total + delete (icon only) */}
                <div className="col-start-2 flex items-center justify-between">
                  <div className="-ml-1 scale-90 origin-left">
                    <QtyStepper
                      value={l.qty}
                      onAdd={() => cart.increment(l.item)}
                      onRemove={() => cart.decrement(l.item)}
                      onSet={(q) => cart.setQty(l.item, q)}
                    />
                  </div>

                  <span className="mx-2 inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#1d2440] text-[color:var(--color-primary)]">
                    ₹{l.lineTotal.toFixed(0)}
                  </span>

                  <button
                    onClick={() => cart.clearItem(l.item)}
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
      <div className="h-4" />
      {/* Customer Form */}
      {lines.length > 0 && (
        <div ref={formRef} className="mt-4">
          {(showForm || formSubmitted) && (
            <div className="rounded-xl border border-gray-800 bg-[#101729] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg">Customer Details</h3>
                <div className="flex items-center gap-1">
                  <button
                    className="p-2 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-600/10"
                    onClick={handleEditDetails}
                    title="Edit details"
                    aria-label="Edit details"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-600/10"
                    onClick={handleDeleteDetails}
                    title="Delete details"
                    aria-label="Delete details"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {formSubmitted && !editing && (
                <div className="text-xs text-gray-300 bg-[#0e1530] border border-gray-800 rounded-md p-3">
                  <div className="font-medium text-white mb-1">Saved contact:</div>
                  <div>Name: <span className="text-gray-200">{form.name}</span></div>
                  <div>Phone: <span className="text-gray-200">{form.phone}</span></div>
                  <div>Address: <span className="text-gray-200">{form.address}</span></div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-400 mb-1">Full Name</label>
                  <div className="relative">
                    <input
                      ref={firstInputRef}
                      className={uiFieldClass(formTouched && form.name.trim().length < 2, editing)}
                      placeholder="e.g., user"
                      value={form.name}
                      disabled={!editing}
                      onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                      onBlur={() => setFormTouched(true)}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#1b2340] disabled:opacity-40"
                      onClick={clearName}
                      disabled={!editing || form.name.length === 0}
                      aria-label="Clear name"
                      title="Clear name"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-400 mb-1">
                    WhatsApp Phone (with country code, numbers only)
                  </label>
                  <div className="relative">
                    <input
                      className={uiFieldClass(formTouched && !/^\d{10,15}$/.test(form.phone.trim()), editing)}
                      placeholder="e.g., 9198XXXXXXXX"
                      value={form.phone}
                      disabled={!editing}
                      onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value.replace(/[^\d]/g, "") }))}
                      onBlur={() => setFormTouched(true)}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#1b2340] disabled:opacity-40"
                      onClick={clearPhone}
                      disabled={!editing || form.phone.length === 0}
                      aria-label="Clear phone"
                      title="Clear phone"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-400 mb-1">Address</label>
                <div className="relative">
                  <textarea
                    rows={3}
                    className={uiFieldClass(formTouched && form.address.trim().length < 6, editing)}
                    placeholder="House / Street, Area, City, State, PIN"
                    value={form.address}
                    disabled={!editing}
                    onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                    onBlur={() => setFormTouched(true)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2 p-1 rounded hover:bg-[#1b2340] disabled:opacity-40"
                    onClick={clearAddress}
                    disabled={!editing || form.address.length === 0}
                    aria-label="Clear address"
                    title="Clear address"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              {formTouched && !formValid && (
                <p className="text-xs text-amber-300">
                  Please fill all fields correctly (valid name, 10–15 digit phone, proper address).
                </p>
              )}
              {editing && (
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-2 rounded-md bg-[color:var(--color-primary)] text-white text-sm hover:saturate-125 disabled:opacity-40"
                    onClick={() => {
                      setFormTouched(true);
                      if (!formValid) return;
                      try {
                        localStorage.setItem(LOCAL_SUBMITTED_KEY, "true");
                      } catch { }
                      setFormSubmitted(true);
                      setEditing(false);
                      setShowForm(true);
                    }}
                    disabled={!formValid}
                  >
                    Save details
                  </button>
                  {formSubmitted && (
                    <button
                      className="px-3 py-2 rounded-md border border-gray-600 text-gray-300 text-sm hover:bg-gray-600/10"
                      onClick={handleDeleteDetails}
                    >
                      Delete details
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {pdfUrl && showPreview && (
            <div ref={previewRef} id="pdf-preview" className="mt-4">
              <h4 className="text-white font-medium mb-2">PDF Preview</h4>
              <iframe
                src={pdfUrl}
                className="w-full h-[70vh] rounded-lg border border-gray-800 bg-[#0c1323]"
              />
            </div>
          )}
        </div>
      )}
      {/* Footer — TWO BUTTONS ONLY */}
      <div className="fixed inset-x-0 bottom-0 bg-[color:var(--color-card)] border-t border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            className="inline-flex items-center justify-center gap-2 border border-gray-700 rounded-xl py-3 text-gray-300 hover:border-[color:var(--color-primary)] hover:text-white transition disabled:opacity-40"
            onClick={ensurePdfAndTogglePreview}
            disabled={lines.length === 0}
            title={
              !formValid
                ? "Fill the customer form to preview"
                : showPreview
                  ? "Hide Preview"
                  : "Preview PDF"
            }
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
