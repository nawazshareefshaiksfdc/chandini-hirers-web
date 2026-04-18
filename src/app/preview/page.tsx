/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Trash2, Eye, EyeOff, Pencil } from "lucide-react";
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
const LOCAL_CHARGES_KEY = "chandini.order.extraCharges.v2";
type DiscountType = "amount" | "percent";
type ExtraChargesForm = {
  labour: string;
  transport: string;
  discount: string;
  discountType: DiscountType;
};
const emptyChargesForm: ExtraChargesForm = {
  labour: "",
  transport: "",
  discount: "",
  discountType: "amount",
};
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
/* Exact format: "14 DEC 2025 4: 20 PM" */
function formatChandiniDateTime(input?: string | Date | null) {
  if (!input) return "";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return typeof input === "string" ? input : "";
  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = d.getFullYear();
  let hrs = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, "0");
  const ampm = hrs >= 12 ? "PM" : "AM";
  hrs = hrs % 12;
  if (hrs === 0) hrs = 12;
  return `${day} ${mon} ${year} ${hrs}: ${mins} ${ampm}`;
}
/* keep only digits and one decimal point */
function sanitizeMoneyInput(value: string) {
  let result = value.replace(/[^\d.]/g, "");
  const firstDot = result.indexOf(".");
  if (firstDot !== -1) {
    result =
      result.slice(0, firstDot + 1) +
      result.slice(firstDot + 1).replace(/\./g, "");
  }
  return result;
}
function toNumber(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
function hasAnyChargeValue(charges: ExtraChargesForm) {
  return Boolean(
    charges.labour.trim() ||
    charges.transport.trim() ||
    charges.discount.trim()
  );
}
function getDiscountAmount(
  subtotal: number,
  discount: string,
  discountType: DiscountType
) {
  const raw = toNumber(discount);
  if (!raw || raw <= 0) return 0;
  if (discountType === "percent") {
    const pct = Math.min(raw, 100);
    return (subtotal * pct) / 100;
  }
  return raw;
}
function formatMoney(value: number) {
  return `₹${Math.round(value).toFixed(0)}`;
}
export default function PreviewPage() {
  const router = useRouter();
  const cart = useCart();
  const lines = cart.selectedLines;
  // PDF fonts
  const [fontReady, setFontReady] = useState(arePdfFontsReady());
  const [fontOk, setFontOk] = useState(didPdfFontsLoad());
  // Customer form state
  const [form, setForm] = useState<CustomerForm>(emptyCustomerForm);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(true);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  // Charges state
  const [charges, setCharges] = useState<ExtraChargesForm>(emptyChargesForm);
  const [chargesEditing, setChargesEditing] = useState(true);
  const [chargesSubmitted, setChargesSubmitted] = useState(false);
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
      const rawCharges = localStorage.getItem(LOCAL_CHARGES_KEY);
      if (rawCharges) {
        const parsed = JSON.parse(rawCharges);
        const nextCharges: ExtraChargesForm = {
          labour: typeof parsed?.labour === "string" ? parsed.labour : "",
          transport: typeof parsed?.transport === "string" ? parsed.transport : "",
          discount: typeof parsed?.discount === "string" ? parsed.discount : "",
          discountType: parsed?.discountType === "percent" ? "percent" : "amount",
        };
        setCharges(nextCharges);
        if (hasAnyChargeValue(nextCharges)) {
          setChargesSubmitted(true);
          setChargesEditing(false);
        }
      }
    } finally {
      setBootstrapped(true);
    }
  }, []);
  // Persist customer form
  useEffect(() => {
    if (!bootstrapped) return;
    try {
      localStorage.setItem(LOCAL_FORM_KEY, JSON.stringify(form));
    } catch { }
  }, [form, bootstrapped]);
  useEffect(() => {
    if (!bootstrapped) return;
    try {
      localStorage.setItem(LOCAL_FORM_SHOW_KEY, showForm ? "true" : "false");
    } catch { }
  }, [showForm, bootstrapped]);
  // Persist charges
  useEffect(() => {
    if (!bootstrapped) return;
    try {
      localStorage.setItem(LOCAL_CHARGES_KEY, JSON.stringify(charges));
    } catch { }
  }, [charges, bootstrapped]);
  // Scroll to preview
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
  function handleDeleteCustomer() {
    if (!confirm("Delete customer details? This cannot be undone.")) return;
    try {
      localStorage.removeItem(LOCAL_FORM_KEY);
      localStorage.removeItem(LOCAL_SUBMITTED_KEY);
      localStorage.setItem(LOCAL_FORM_SHOW_KEY, "true");
    } catch { }
    setForm(emptyCustomerForm);
    setFormSubmitted(false);
    setEditing(true);
    setShowForm(true);
    revokePrevPdfUrl();
    setPdfUrl(null);
    setShowPreview(false);
  }
  function handleDeleteCharges() {
    if (!confirm("Delete labour, transport and discount details?")) return;
    try {
      localStorage.removeItem(LOCAL_CHARGES_KEY);
    } catch { }
    setCharges(emptyChargesForm);
    setChargesSubmitted(false);
    setChargesEditing(true);
    revokePrevPdfUrl();
    setPdfUrl(null);
    setShowPreview(false);
  }
  const prettyStart = useMemo(() => formatChandiniDateTime(form.startDateTime), [form.startDateTime]);
  const prettyEnd = useMemo(() => formatChandiniDateTime(form.endDateTime), [form.endDateTime]);
  const whenText = useMemo(() => {
    if (prettyStart && prettyEnd) return `${prettyStart} to ${prettyEnd}`;
    return prettyStart || prettyEnd || "";
  }, [prettyStart, prettyEnd]);
  const subtotal = useMemo(() => cart.totalAmount, [cart.totalAmount]);
  const labourAmount = useMemo(() => toNumber(charges.labour), [charges.labour]);
  const transportAmount = useMemo(() => toNumber(charges.transport), [charges.transport]);
  const combinedLabourTransport = useMemo(() => {
    return labourAmount + transportAmount;
  }, [labourAmount, transportAmount]);
  const discountAmount = useMemo(() => {
    return getDiscountAmount(subtotal, charges.discount, charges.discountType);
  }, [subtotal, charges.discount, charges.discountType]);
  const grandTotal = useMemo(() => {
    const total = subtotal - discountAmount + combinedLabourTransport;
    return total < 0 ? 0 : total;
  }, [subtotal, discountAmount, combinedLabourTransport]);
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
        charges,
        totals: {
          items: cart.totalItems,
          subtotal,
          labourAmount,
          transportAmount,
          combinedLabourTransport,
          discountAmount,
          grandTotal,
        },
        lines: lines.map((l) => ({
          id: l.item.id,
          qty: l.qty,
          lineTotal: l.lineTotal,
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
      charges,
      cart.totalItems,
      subtotal,
      labourAmount,
      transportAmount,
      combinedLabourTransport,
      discountAmount,
      grandTotal,
      lines,
    ]
  );
  useEffect(() => {
    revokePrevPdfUrl();
    setPdfUrl(null);
    if (showPreview && lines.length > 0) {
      (async () => {
        const bytes = await generateCartPdfBytes({
          lines,
          totalItems: cart.totalItems,
          totalAmount: grandTotal,
          customer: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            eventType: form.eventType || "",
            startDateTime: prettyStart || "",
            endDateTime: prettyEnd || "",
            mapUrl: form.mapUrl || "",
          },
          subtotal,
          labourCharges: labourAmount,
          transportCharges: transportAmount,
          discount: discountAmount,
          discountType: charges.discountType,
          discountValue: charges.discount,
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
        totalAmount: grandTotal,
        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          eventType: form.eventType || "",
          startDateTime: prettyStart || "",
          endDateTime: prettyEnd || "",
          mapUrl: form.mapUrl || "",
        },
        subtotal,
        labourCharges: labourAmount,
        transportCharges: transportAmount,
        discount: discountAmount,
        discountType: charges.discountType,
        discountValue: charges.discount,
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
    } catch { }
    setFormSubmitted(true);
    const bytes = await generateCartPdfBytes({
      lines,
      totalItems: cart.totalItems,
      totalAmount: grandTotal,
      customer: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        eventType: form.eventType || "",
        startDateTime: prettyStart || "",
        endDateTime: prettyEnd || "",
        mapUrl: form.mapUrl || "",
      },
      subtotal,
      labourCharges: labourAmount,
      transportCharges: transportAmount,
      discount: discountAmount,
      discountType: charges.discountType,
      discountValue: charges.discount,
    });
    const filename = buildPdfFilename(form.name);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const file = new File([blob], filename, { type: "application/pdf" });
    const nav = navigator as any;
    if (nav.canShare?.({ files: [file] })) {
      try {
        await nav.share?.({
          title: "Chandini Hirers Order",
          text: `Order for ${form.name} (₹${grandTotal.toFixed(0)})`,
          files: [file],
        });
        return;
      } catch { }
    }
    robustDownloadPdf(bytes, filename);
    const linesTxt = lines
      .map((l) => `• ${l.item.name} x ${l.qty} = ₹${l.lineTotal.toFixed(0)}`)
      .join("%0A");
    const pricingLines = [
      `Subtotal: ₹${subtotal.toFixed(0)}`,
      charges.discount.trim()
        ? `Discount: ${charges.discountType === "percent"
          ? `${charges.discount}%`
          : `₹${charges.discount}`
        }`
        : null,
      discountAmount > 0 ? `Discount Applied: ₹${discountAmount.toFixed(0)}` : null,
      combinedLabourTransport > 0
        ? `${labourAmount > 0 && transportAmount > 0
          ? "Labour & Transport Charges"
          : labourAmount > 0
            ? "Labour Charges"
            : "Transport Charges"
        }: ₹${combinedLabourTransport.toFixed(0)}`
        : null,
      `Total: ₹${grandTotal.toFixed(0)}`,
    ]
      .filter(Boolean)
      .join("%0A");
    const detail =
      `Name: ${encodeURIComponent(form.name)}%0A` +
      `Phone: ${encodeURIComponent(form.phone)}%0A` +
      `Event: ${encodeURIComponent(form.eventType)}%0A` +
      `When: ${encodeURIComponent(whenText)}%0A` +
      `Address: ${encodeURIComponent(form.address)}%0A` +
      (form.mapUrl ? `Map: ${encodeURIComponent(form.mapUrl)}%0A` : "");
    const waUrl = `https://wa.me/${encodeURIComponent(form.phone)}?text=${`Chandini Hirers - Order%0A%0A${linesTxt}%0A%0A${pricingLines}%0A%0A${detail}`}`;
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
    setCharges(emptyChargesForm);
    try {
      localStorage.removeItem(LOCAL_FORM_KEY);
      localStorage.removeItem(LOCAL_SUBMITTED_KEY);
      localStorage.removeItem(LOCAL_CHARGES_KEY);
      localStorage.setItem(LOCAL_FORM_SHOW_KEY, "true");
    } catch { }
    setFormSubmitted(false);
    setEditing(true);
    setChargesSubmitted(false);
    setChargesEditing(true);
  };
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 pb-56 sm:px-6 lg:px-8">
      <header className="py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-3 py-1.5 rounded-xl border text-sm font-medium text-[color:var(--color-primary)] border-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)] hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-[color:var(--color-text)]">Preview</h2>
            {whenText ? (
              <div className="text-xs text-[color:var(--color-muted)] leading-tight">
                {form.eventType ? (
                  <span className="mr-2">
                    Event: <span className="text-[color:var(--color-muted)]">{form.eventType}</span>
                  </span>
                ) : null}
                <span>
                  When: <span className="text-[color:var(--color-muted)]">{whenText}</span>
                </span>
              </div>
            ) : null}
          </div>
        </div>
        <button
          className="text-sm px-3 py-1.5 rounded-xl border border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:border-[color:var(--color-primary)] hover:text-white transition disabled:opacity-40"
          onClick={handleClearAll}
          disabled={lines.length === 0}
        >
          Clear All
        </button>
      </header>
      {lines.length === 0 ? (
        <div className="text-center text-[color:var(--color-muted)] py-16 text-sm">No items to preview</div>
      ) : (
        <div className="space-y-4">
          {lines.map((l) => (
            <div
              key={l.item.id}
              className="relative overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] hover:bg-[color:var(--color-primary-weak)] transition px-2 py-2 sm:px-3 sm:py-2"
            >
              <div className="hidden sm:flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative w-[85px] h-[85px] flex-shrink-0 overflow-hidden rounded-md bg-[color:var(--color-bg)]">
                    <Image
                      src={l.item.previewImage || l.item.imageAssets?.[0] || "/images/placeholder.jpeg"}
                      alt={l.item.name}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <div className="font-medium text-[color:var(--color-text)] text-[15px] truncate leading-tight">
                      {l.item.name}
                    </div>
                    <div className="text-xs text-[color:var(--color-muted)] leading-tight">
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
                    className="p-1.5 rounded-md hover:bg-[color:var(--color-primary-weak)] text-[color:var(--color-muted)] hover:text-white transition"
                    title="Remove item"
                    aria-label={`Remove ${l.item.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="sm:hidden grid grid-cols-[72px,1fr] gap-2">
                <div className="row-span-3 relative w-[72px] h-[72px] overflow-hidden rounded-md bg-[color:var(--color-bg)]">
                  <Image
                    src={l.item.previewImage || l.item.imageAssets?.[0] || "/images/placeholder.jpeg"}
                    alt={l.item.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex items-start justify-between gap-2">
                  <div
                    className="min-w-0 text-[13px] font-medium text-[color:var(--color-text)] leading-tight"
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
                  <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[color:var(--color-primary-weak)] text-[color:var(--color-primary)]">
                    ₹{l.lineTotal.toFixed(0)}
                  </span>
                </div>
                <div className="col-start-2 text-[12px] text-[color:var(--color-muted)] whitespace-nowrap -mt-1">
                  ₹{l.item.price.toFixed(0)} each
                </div>
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
                    className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-[color:var(--color-bg)] text-[color:var(--color-muted)] hover:bg-[color:var(--color-primary-weak)] transition shrink-0"
                    title="Remove item"
                    aria-label={`Remove ${l.item.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-4">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h3 className="text-[color:var(--color-text)] font-semibold text-lg">Charges & Adjustments</h3>
              <div className="flex items-center gap-2">
                {!chargesEditing && (
                  <button
                    onClick={() => setChargesEditing(true)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-white hover:border-[color:var(--color-primary)] transition"
                    title="Edit charges"
                    aria-label="Edit charges"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleDeleteCharges}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-[color:var(--color-border)] text-[color:var(--color-muted)] hover:text-white hover:border-red-500 transition"
                  title="Delete charges"
                  aria-label="Delete charges"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {chargesEditing ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-[color:var(--color-muted)]">Labour Charges</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={charges.labour}
                      onChange={(e) =>
                        setCharges((prev) => ({
                          ...prev,
                          labour: sanitizeMoneyInput(e.target.value),
                        }))
                      }
                      placeholder="e.g. 500"
                      className="w-full mt-1 rounded-md bg-[color:var(--color-bg)] border border-[color:var(--color-border)] px-3 py-2 text-[color:var(--color-text)] outline-none focus:border-[color:var(--color-primary)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[color:var(--color-muted)]">Transport Charges</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={charges.transport}
                      onChange={(e) =>
                        setCharges((prev) => ({
                          ...prev,
                          transport: sanitizeMoneyInput(e.target.value),
                        }))
                      }
                      placeholder="e.g. 300"
                      className="w-full mt-1 rounded-md bg-[color:var(--color-bg)] border border-[color:var(--color-border)] px-3 py-2 text-[color:var(--color-text)] outline-none focus:border-[color:var(--color-primary)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[color:var(--color-muted)] block mb-1">Discount</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={charges.discount}
                        onChange={(e) =>
                          setCharges((prev) => ({
                            ...prev,
                            discount: sanitizeMoneyInput(e.target.value),
                          }))
                        }
                        placeholder={charges.discountType === "percent" ? "e.g. 10" : "e.g. 200"}
                        className="flex-1 rounded-md bg-[color:var(--color-bg)] border border-[color:var(--color-border)] px-3 py-2 text-[color:var(--color-text)] outline-none focus:border-[color:var(--color-primary)]"
                      />
                      <div>
                        <label htmlFor="discountType" className="sr-only">
                          Discount type
                        </label>
                        <select
                          id="discountType"
                          value={charges.discountType}
                          onChange={(e) =>
                            setCharges((prev) => ({
                              ...prev,
                              discountType: e.target.value === "percent" ? "percent" : "amount",
                            }))
                          }
                          className="rounded-md bg-[color:var(--color-bg)] border border-[color:var(--color-border)] px-3 py-2 text-[color:var(--color-text)] outline-none focus:border-[color:var(--color-primary)]"
                        >
                          <option value="amount">₹</option>
                          <option value="percent">%</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setChargesSubmitted(true);
                      setChargesEditing(false);
                    }}
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-[color:var(--color-primary)] text-white hover:saturate-125 transition"
                  >
                    Save charges
                  </button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {charges.labour.trim() ? (
                  <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-3">
                    <div className="text-[color:var(--color-muted)] text-xs mb-1">Labour Charges</div>
                    <div className="text-[color:var(--color-text)] font-medium">₹{charges.labour}</div>
                  </div>
                ) : null}
                {charges.transport.trim() ? (
                  <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-3">
                    <div className="text-[color:var(--color-muted)] text-xs mb-1">Transport Charges</div>
                    <div className="text-[color:var(--color-text)] font-medium">₹{charges.transport}</div>
                  </div>
                ) : null}
                {charges.discount.trim() ? (
                  <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-3 sm:col-span-2">
                    <div className="text-[color:var(--color-muted)] text-xs mb-1">Discount</div>
                    <div className="text-[color:var(--color-text)] font-medium">
                      {charges.discountType === "percent"
                        ? `${charges.discount}%`
                        : `₹${charges.discount}`}
                    </div>
                  </div>
                ) : null}
                {!charges.labour.trim() &&
                  !charges.transport.trim() &&
                  !charges.discount.trim() ? (
                  <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-3 sm:col-span-2 text-[color:var(--color-muted)]">
                    No additional charges added.
                  </div>
                ) : null}
              </div>
            )}
          </div>
          <div className="text-right px-2 sm:px-4 mt-2 space-y-1">
            <div className="text-sm text-[color:var(--color-muted)]">
              Total Items: <span className="font-medium text-[color:var(--color-text)]">{cart.totalItems}</span>
            </div>
            <div className="text-sm text-[color:var(--color-muted)]">
              Subtotal: <span className="font-medium text-[color:var(--color-text)]">{formatMoney(subtotal)}</span>
            </div>
            {charges.discount.trim() ? (
              <div className="text-sm text-[color:var(--color-muted)]">
                Discount:{" "}
                <span className="font-medium text-red-400">
                  -{formatMoney(discountAmount)}
                  {charges.discountType === "percent"
                    ? ` (${charges.discount}%)`
                    : ` (₹${charges.discount})`}
                </span>
              </div>
            ) : null}
            {combinedLabourTransport > 0 ? (
              <div className="text-sm text-[color:var(--color-muted)]">
                {labourAmount > 0 && transportAmount > 0
                  ? "Labour & Transport Charges:"
                  : labourAmount > 0
                    ? "Labour Charges:"
                    : "Transport Charges:"}{" "}
                <span className="font-medium text-[color:var(--color-text)]">
                  {formatMoney(combinedLabourTransport)}
                </span>
              </div>
            ) : null}
            <div className="text-sm text-[color:var(--color-muted)] border-t border-[color:var(--color-border)] pt-2">
              Total Amount:{" "}
              <span className="font-semibold text-[color:var(--color-primary)]">
                {formatMoney(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      )}
      {lines.length > 0 && (
        <div ref={formRef} className="mt-4">
          <CustomerFormCard
            value={form}
            onChange={setForm}
            editing={editing}
            showHeader
            onEdit={() => setEditing(true)}
            onDelete={handleDeleteCustomer}
            onSubmit={() => {
              try {
                localStorage.setItem(LOCAL_SUBMITTED_KEY, "true");
              } catch { }
              setFormSubmitted(true);
              setEditing(false);
              setShowForm(true);
            }}
          />
          {pdfUrl && showPreview && (
            <div ref={previewRef} id="pdf-preview" className="mt-4">
              <h4 className="text-[color:var(--color-text)] font-medium mb-2">PDF Preview</h4>
              <iframe
                src={pdfUrl}
                title="PDF preview"
                className="w-full h-[56vh] sm:h-[70vh] rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)]"
              />
            </div>
          )}
        </div>
      )}
      <div className="fixed inset-x-0 bottom-0 bg-[color:var(--color-card)] border-t border-[color:var(--color-border)]">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-3 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            className="inline-flex items-center justify-center gap-2 border border-[color:var(--color-border)] rounded-xl py-3 text-[color:var(--color-muted)] hover:border-[color:var(--color-primary)] hover:text-white transition disabled:opacity-40"
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




