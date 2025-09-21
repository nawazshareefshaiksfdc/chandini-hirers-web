import { jsPDF, type TextOptionsLight } from "jspdf";
import type { Item } from "@/types";

export type Line = { item: Item; qty: number; lineTotal: number };

let fontsReady = false;
let fontsOk = false;
let fontsPromise: Promise<void> | null = null;
let dejavuRegB64: string | null = null;
let dejavuBoldB64: string | null = null;

type NavigatorWithMsSave = Navigator & {
  msSaveOrOpenBlob?: (blob: Blob, defaultName?: string) => boolean;
};

const INR0 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
  currencyDisplay: "symbol",
});
function formatINR(amount: number) {
  return fontsOk ? INR0.format(amount) : "Rs " + Math.round(amount).toLocaleString("en-IN");
}

async function toBase64(buf: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buf);
  const size = 0x8000;
  for (let i = 0; i < bytes.length; i += size) {
    binary += String.fromCharCode(...bytes.subarray(i, i + size));
  }
  return btoa(binary);
}

async function _loadFonts() {
  try {
    const [regRes, boldRes] = await Promise.all([
      fetch("/fonts/DejaVuSans.ttf"),
      fetch("/fonts/DejaVuSans-Bold.ttf"),
    ]);
    if (!regRes.ok || !boldRes.ok) throw new Error("Font fetch failed");
    const [regBuf, boldBuf] = await Promise.all([regRes.arrayBuffer(), boldRes.arrayBuffer()]);
    dejavuRegB64 = await toBase64(regBuf);
    dejavuBoldB64 = await toBase64(boldBuf);
    fontsOk = true;
  } catch (e) {
    console.warn("[pdf] Font load failed; using Rs- fallback formatting.", e);
    fontsOk = false;
  } finally {
    fontsReady = true;
  }
}

export function preloadPdfFonts(): Promise<boolean> {
  if (fontsReady) return Promise.resolve(fontsOk);
  if (!fontsPromise) fontsPromise = _loadFonts();
  return fontsPromise.then(() => fontsOk);
}
export const arePdfFontsReady = () => fontsReady;
export const didPdfFontsLoad = () => fontsOk;

async function ensureFonts(doc: jsPDF) {
  if (!fontsReady) {
    if (!fontsPromise) fontsPromise = _loadFonts();
    await fontsPromise;
  }
  if (fontsOk && dejavuRegB64 && dejavuBoldB64) {
    doc.addFileToVFS("DejaVuSans.ttf", dejavuRegB64);
    doc.addFont("DejaVuSans.ttf", "DejaVu", "normal");
    doc.addFileToVFS("DejaVuSans-Bold.ttf", dejavuBoldB64);
    doc.addFont("DejaVuSans-Bold.ttf", "DejaVu", "bold");
    try {
      doc.setFont("DejaVu", "normal");
    } catch {
      /* noop */
    }
  } else {
    doc.setFont("helvetica", "normal");
  }
}

export async function generateCartPdfBytes(params: {
  title?: string;
  lines: Line[];
  totalItems: number;
  totalAmount: number;
}) {
  const { title = "Chandini Hirers", lines, totalItems, totalAmount } = params;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  await ensureFonts(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const rowH = 18;

  const colItemX = margin + 10;
  const colQtyX = pageWidth - 180;
  const colAmtRight = pageWidth - margin;

  const RIGHT: TextOptionsLight = { align: "right" } as const;

  // Header
  doc.setFontSize(16);
  try {
    doc.setFont("DejaVu", "bold");
  } catch {
    doc.setFont("helvetica", "bold");
  }
  doc.text(title, margin, margin + 10);

  const dateStr = new Date().toISOString().slice(0, 16).replace("T", " ");
  doc.setFontSize(11);
  try {
    doc.setFont("DejaVu", "normal");
  } catch {
    doc.setFont("helvetica", "normal");
  }
  doc.text(`Generated: ${dateStr}`, margin, margin + 30);

  // Table header
  let y = margin + 70;
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y - 16, pageWidth - margin * 2, 24, "F");
  try {
    doc.setFont("DejaVu", "bold");
  } catch {
    doc.setFont("helvetica", "bold");
  }
  doc.text("Item", colItemX, y);
  doc.text("Qty", colQtyX, y);
  doc.text("Amount", colAmtRight, y, RIGHT);

  try {
    doc.setFont("DejaVu", "normal");
  } catch {
    doc.setFont("helvetica", "normal");
  }
  y += rowH;

  const addPageIfNeeded = () => {
    if (y > pageHeight - margin - 60) {
      doc.addPage();
      // re-header
      doc.setFontSize(16);
      try {
        doc.setFont("DejaVu", "bold");
      } catch {
        doc.setFont("helvetica", "bold");
      }
      doc.text(title, margin, margin + 10);
      doc.setFontSize(11);
      try {
        doc.setFont("DejaVu", "normal");
      } catch {
        doc.setFont("helvetica", "normal");
      }
      doc.text(`Generated: ${dateStr}`, margin, margin + 30);

      const yy = margin + 50;
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yy - 16, pageWidth - margin * 2, 24, "F");
      try {
        doc.setFont("DejaVu", "bold");
      } catch {
        doc.setFont("helvetica", "bold");
      }
      doc.text("Item", colItemX, yy);
      doc.text("Qty", colQtyX, yy);
      doc.text("Amount", colAmtRight, yy, RIGHT);

      try {
        doc.setFont("DejaVu", "normal");
      } catch {
        doc.setFont("helvetica", "normal");
      }
      y = yy + rowH;
    }
  };

  // Rows
  for (const l of lines) {
    addPageIfNeeded();
    const priceStr = formatINR(l.item.price);
    const amountStr = formatINR(l.lineTotal);

    doc.text(`${l.item.name} (${priceStr})`, colItemX, y);
    doc.text(String(l.qty), colQtyX, y);
    doc.text(amountStr, colAmtRight, y, RIGHT);

    y += rowH;
  }

  // Totals
  y += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  try {
    doc.setFont("DejaVu", "bold");
  } catch {
    doc.setFont("helvetica", "bold");
  }
  doc.text("Total Items:", pageWidth - 250, y);
  doc.text(String(totalItems), colAmtRight, y, RIGHT);

  y += rowH;
  doc.text("Total Amount:", pageWidth - 250, y);
  doc.text(formatINR(totalAmount), colAmtRight, y, RIGHT);

  return doc.output("arraybuffer");
}

export function robustDownloadPdf(bytes: ArrayBuffer, filename: string) {
  try {
    const blob = new Blob([bytes], { type: "application/pdf" });

    const nav = navigator as NavigatorWithMsSave;
    if (typeof nav.msSaveOrOpenBlob === "function") {
      nav.msSaveOrOpenBlob(blob, filename);
      return;
    }

    const url = URL.createObjectURL(blob);

    const isIOS =
      /iP(ad|hone|od)/.test(navigator.platform) ||
      (navigator.userAgent.includes("Mac") && "ontouchend" in document);

    const a = document.createElement("a");
    a.href = url;
    a.rel = "noopener";
    a.target = isIOS ? "_blank" : "_self";
    if (!isIOS) a.download = filename;

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1000);
  } catch (err: unknown) {
    console.error("[pdf] Download failed:", err);
    alert("Could not download the PDF. Try Share or long-press → ‘Download Linked File’.");    
  }
}
