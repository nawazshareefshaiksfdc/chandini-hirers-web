// src/utils/pdf.ts
import { jsPDF, type TextOptionsLight } from "jspdf";
import type { Item } from "@/types";

/* ============================================================
   Types
============================================================ */
export type Line = { item: Item; qty: number; lineTotal: number };
type NavigatorWithMsSave = Navigator & {
  msSaveOrOpenBlob?: (blob: Blob, defaultName?: string) => boolean;
};
type NextDataPartial = {
  assetPrefix?: string;
  basePath?: string;
};

/* ============================================================
   INR formatting
============================================================ */
const INR0 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
  currencyDisplay: "symbol",
});
function formatINR(amount: number, fontsOk: boolean) {
  return fontsOk
    ? INR0.format(amount)
    : "Rs " + Math.round(amount).toLocaleString("en-IN");
}

/* ============================================================
   Asset loading state (fonts + icons)
============================================================ */
let fontsReady = false;
let fontsOk = false;
let fontsPromise: Promise<void> | null = null;
let dejavuRegB64: string | null = null;
let dejavuBoldB64: string | null = null;
let iconsReady = false;
let iconsPromise: Promise<void> | null = null;
let iconInstagramB64: string | null = null;
let iconYouTubeB64: string | null = null;
let iconMapPinB64: string | null = null;

export const arePdfFontsReady = () => fontsReady;
export const didPdfFontsLoad = () => fontsOk;

/* ============================================================
   Resolve asset URLs
============================================================ */
function getBasePrefix(): string {
  try {
    const dRaw: unknown = (
      globalThis as unknown as { __NEXT_DATA__?: NextDataPartial }
    )?.__NEXT_DATA__;
    if (dRaw && typeof dRaw === "object") {
      const d = dRaw as NextDataPartial;
      if (typeof d.assetPrefix === "string" && d.assetPrefix.length > 0)
        return d.assetPrefix;
      if (typeof d.basePath === "string" && d.basePath.length > 0)
        return d.basePath;
    }
  } catch {}
  const envBase = process.env.NEXT_PUBLIC_BASE_PATH;
  if (typeof envBase === "string" && envBase.length > 0) return envBase;
  if (typeof document !== "undefined") {
    const base = document.querySelector("base")?.getAttribute("href");
    if (base && base !== "/") return base.replace(/\/$/, "");
  }
  return "";
}

function withBase(path: string): string {
  const prefix = getBasePrefix().replace(/\/$/, "");
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return prefix ? `${prefix}/${clean}` : `/${clean}`;
}

/* ============================================================
   Utilities
============================================================ */
async function toBase64(buf: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buf);
  const size = 0x8000;
  for (let i = 0; i < bytes.length; i += size) {
    binary += String.fromCharCode(...bytes.subarray(i, i + size));
  }
  return btoa(binary);
}

async function fetchAsBase64(url: string) {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
  const buf = await res.arrayBuffer();
  return toBase64(buf);
}

/* ============================================================
   Load fonts (DejaVu Sans)
============================================================ */
async function _loadFonts() {
  try {
    const [regB64, boldB64] = await Promise.all([
      fetchAsBase64(withBase("fonts/DejaVuSans.ttf")),
      fetchAsBase64(withBase("fonts/DejaVuSans-Bold.ttf")),
    ]);
    dejavuRegB64 = regB64;
    dejavuBoldB64 = boldB64;
    fontsOk = true;
  } catch (e) {
    console.warn("[pdf] Font load failed; using Rs fallback formatting.", e);
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
    } catch {}
  } else {
    doc.setFont("helvetica", "normal");
  }
}

/* ============================================================
   Load footer icons
============================================================ */
async function _loadIcons() {
  try {
    const [ig, yt, mp] = await Promise.all([
      fetchAsBase64(withBase("icons/instagram.png")),
      fetchAsBase64(withBase("icons/youtube.png")),
      fetchAsBase64(withBase("icons/map-pin.png")),
    ]);
    iconInstagramB64 = ig;
    iconYouTubeB64 = yt;
    iconMapPinB64 = mp;
  } catch (e) {
    console.warn("[pdf] Footer icons failed to load; omitting icons.", e);
  } finally {
    iconsReady = true;
  }
}
async function ensureIcons() {
  if (iconsReady) return;
  if (!iconsPromise) iconsPromise = _loadIcons();
  await iconsPromise;
}

/* ============================================================
   Watermark
============================================================ */
function drawTiledDiagonalWatermark(doc: jsPDF, text: string) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const angle = 45;
  const stepX = 120;
  const stepY = 80;
  const size = 9;
  const color = 200;

  doc.saveGraphicsState?.();
  doc.setTextColor(color, color, color);
  doc.setFontSize(size);

  for (let y = -stepY; y < pageH + stepY; y += stepY) {
    for (let x = -stepX; x < pageW + stepX; x += stepX) {
      doc.text(text, x, y, { angle });
    }
  }

  const xOffset = stepX / 2;
  const yOffset = stepY / 2;
  for (let y = -stepY + yOffset; y < pageH + stepY; y += stepY) {
    for (let x = -stepX + xOffset; x < pageW + stepX; x += stepX) {
      doc.text(text, x, y, { angle });
    }
  }
  doc.restoreGraphicsState?.();
}

/* ============================================================
   Footer icons
============================================================ */
function addFooterIcons(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const centerY = pageH - margin;
  const iconSize = 18;
  const gap = 18;

  doc.setFontSize(10);
  try {
    doc.setFont("DejaVu", "bold");
  } catch {
    doc.setFont("helvetica", "bold");
  }
  doc.text("Connect:", margin, centerY);
  let x = margin + doc.getTextWidth("Connect:") + 16;

  const icons = [
    { b64: iconInstagramB64, url: "https://www.instagram.com/chandhinihirers_nellore/", alt: "Instagram" },
    { b64: iconYouTubeB64, url: "https://www.youtube.com/@chandhinihirers_nellore", alt: "YouTube" },
    { b64: iconMapPinB64, url: "https://maps.app.goo.gl/o3orgsRNWrdUJZh76", alt: "Maps" },
  ];

  icons.forEach((ico) => {
    if (ico.b64) {
      doc.addImage(`data:image/png;base64,${ico.b64}`, "PNG", x, centerY - iconSize + 2, iconSize, iconSize);
      doc.link(x, centerY - iconSize + 2, iconSize, iconSize, { url: ico.url });
      x += iconSize + gap;
    } else {
      doc.text(ico.alt, x, centerY);
      x += doc.getTextWidth(ico.alt) + gap;
    }
  });
}

/* ============================================================
   PDF Builder
============================================================ */
export async function generateCartPdfBytes(params: {
  title?: string;
  lines: Line[];
  totalItems: number;
  totalAmount: number;
}) {
  const { title = "Chandini Hirers", lines, totalItems, totalAmount } = params;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  await ensureFonts(doc);
  await ensureIcons();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const rowH = 28;
  const colItemX = margin + 10;
  const colQtyX = pageWidth - 180;
  const colAmtRight = pageWidth - margin;
  const RIGHT: TextOptionsLight = { align: "right" } as const;
  const dateStr = new Date().toISOString().slice(0, 16).replace("T", " ");

  const imageCache = new Map<string, string>();
  async function getItemImageB64(url: string): Promise<string | null> {
    if (imageCache.has(url)) return imageCache.get(url)!;
    try {
      const res = await fetch(url, { cache: "force-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      const b64 = await toBase64(buf);
      const dataUrl = `data:image/jpeg;base64,${b64}`;
      imageCache.set(url, dataUrl);
      return dataUrl;
    } catch (e) {
      console.warn("[pdf] Failed to load item image:", url, e);
      return null;
    }
  }

  const drawHeader = () => {
    // Watermark first (so header sits above)
    drawTiledDiagonalWatermark(doc, "chandini hirers");
    // Header
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
    // Table header
    const thY = margin + 70;
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, thY - 16, pageWidth - margin * 2, 24, "F");
    try {
      doc.setFont("DejaVu", "bold");
    } catch {
      doc.setFont("helvetica", "bold");
    }
    doc.text("Item", colItemX, thY);
    doc.text("Qty", colQtyX, thY);
    doc.text("Amount", colAmtRight, thY, RIGHT);
    try {
      doc.setFont("DejaVu", "normal");
    } catch {
      doc.setFont("helvetica", "normal");
    }
    return thY + rowH;
  };

  let y = drawHeader();
  const addPageIfNeeded = () => {
    if (y > pageHeight - margin - 100) {
      addFooterIcons(doc);
      doc.addPage();
      y = drawHeader();
    }
  };

  // 🔹 Rows with image thumbnails
  for (const l of lines) {
    addPageIfNeeded();

    const priceStr = formatINR(l.item.price, fontsOk);
    const amountStr = formatINR(l.lineTotal, fontsOk);
    const imgUrl = l.item.previewImage || l.item.imageAssets?.[0] || "/images/placeholder.jpeg";
    const imgY = y - 12;
    const imgSize = 28;

    if (imgUrl) {
      try {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
        const fullUrl = `${baseUrl}${withBase(imgUrl)}`;
        console.log("[pdf] Fetching image:", fullUrl);
        const b64 = await getItemImageB64(fullUrl);
        if (b64) doc.addImage(b64, "JPEG", margin, imgY, imgSize, imgSize);
      } catch (e) {
        console.warn("[pdf] Could not add image for", l.item.name, e);
      }
    }

    const textX = margin + imgSize + 8;
    doc.text(`${l.item.name} (${priceStr})`, textX, y);
    doc.text(String(l.qty), colQtyX, y);
    doc.text(amountStr, colAmtRight, y, RIGHT);
    y += rowH + 10;
  }

  /* Totals */
  y += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;
  doc.setFont("helvetica", "bold");
  doc.text("Total Items:", pageWidth - 250, y);
  doc.text(String(totalItems), colAmtRight, y, RIGHT);
  y += rowH;
  doc.text("Total Amount:", pageWidth - 250, y);
  doc.text(formatINR(totalAmount, fontsOk), colAmtRight, y, RIGHT);
  addFooterIcons(doc);
  return doc.output("arraybuffer");
}

/* ============================================================
   Robust Downloader
============================================================ */
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
    alert("Could not download the PDF. Try again or use ‘Download Linked File’.");
  }
}
