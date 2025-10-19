import { jsPDF, type TextOptionsLight } from "jspdf";
import type { Item } from "@/types";

/* =========================== Types =========================== */
export type Line = { item: Item; qty: number; lineTotal: number };

type NavigatorWithMsSave = Navigator & {
  msSaveOrOpenBlob?: (blob: Blob, defaultName?: string) => boolean;
};
type NextDataPartial = { assetPrefix?: string; basePath?: string };

/* ===================== INR formatting ======================== */
const INR0 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
  currencyDisplay: "symbol",
});
function formatINR(amount: number, fontsOk: boolean) {
  return fontsOk ? INR0.format(amount) : "Rs " + Math.round(amount).toLocaleString("en-IN");
}

/* ============ Asset loading state (fonts/icons) ============== */
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

/* ===================== Resolve asset URLs ==================== */
function getBasePrefix(): string {
  try {
    const dRaw: unknown = (globalThis as unknown as { __NEXT_DATA__?: NextDataPartial })?.__NEXT_DATA__;
    if (dRaw && typeof dRaw === "object") {
      const d = dRaw as NextDataPartial;
      if (typeof d.assetPrefix === "string" && d.assetPrefix.length > 0) return d.assetPrefix;
      if (typeof d.basePath === "string" && d.basePath.length > 0) return d.basePath;
    }
  } catch { }
  const envBase = process.env.NEXT_PUBLIC_BASE_PATH;
  if (typeof envBase === "string" && envBase.length > 0) return envBase;
  if (typeof document !== "undefined") {
    const base = document.querySelector("base")?.getAttribute("href");
    if (base && base !== "/") return base.replace(/\/$/, "");
  }
  return "";
}
function withBase(path: string): string {
  if (/^https?:\/\//i.test(path) || /^data:/i.test(path)) return path;
  const prefix = getBasePrefix().replace(/\/$/, "");
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return prefix ? `${prefix}/${clean}` : `/${clean}`;
}

/* ========================= Utilities ========================= */
async function toBase64(buf: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buf);
  const size = 0x8000;
  for (let i = 0; i < bytes.length; i += size) {
    binary += String.fromCharCode(...bytes.subarray(i, i + size));
  }
  return btoa(binary);
}
async function fetchAsBase64(url: string, cacheMode: RequestCache = "force-cache") {
  const res = await fetch(url, { cache: cacheMode });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
  const buf = await res.arrayBuffer();
  return toBase64(buf);
}

/* ========================= Fonts ============================= */
async function _loadFonts() {
  try {
    const [regB64, boldB64] = await Promise.all([
      fetchAsBase64(withBase("fonts/DejaVuSans.ttf"), "force-cache"),
      fetchAsBase64(withBase("fonts/DejaVuSans-Bold.ttf"), "force-cache"),
    ]);
    dejavuRegB64 = regB64;
    dejavuBoldB64 = boldB64;
    fontsOk = true;
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.log("[pdf-dev] Font load failed; using Rs fallback formatting.");
    }
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
    try { doc.setFont("DejaVu", "normal"); } catch {}
  } else {
    doc.setFont("helvetica", "normal");
  }
}

/* ========================= Icons ============================= */
async function _loadIcons() {
  try {
    const [ig, yt, mp] = await Promise.all([
      fetchAsBase64(withBase("icons/instagram.png"), "force-cache"),
      fetchAsBase64(withBase("icons/youtube.png"), "force-cache"),
      fetchAsBase64(withBase("icons/map-pin.png"), "force-cache"),
    ]);
    iconInstagramB64 = ig;
    iconYouTubeB64 = yt;
    iconMapPinB64 = mp;
  } catch {} finally {
    iconsReady = true;
  }
}
async function ensureIcons() {
  if (iconsReady) return;
  if (!iconsPromise) iconsPromise = _loadIcons();
  await iconsPromise;
}

/* ======================== Watermark ========================== */
function drawTiledDiagonalWatermark(doc: jsPDF, text: string) {
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const angle = 45, stepX = 120, stepY = 80, size = 9, gray = 200;

  doc.saveGraphicsState?.();
  doc.setTextColor(gray, gray, gray);
  doc.setFontSize(size);

  for (let y = -stepY; y < height + stepY; y += stepY) {
    for (let x = -stepX; x < width + stepX; x += stepX) {
      doc.text(text, x, y, { angle });
    }
  }
  doc.restoreGraphicsState?.();
}

/* ======================== Footer icons ====================== */
function addFooterIcons(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth();
  void pageW;
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const centerY = pageH - margin;
  const iconSize = 18;
  const gap = 18;

  doc.setFontSize(10);
  try { doc.setFont("DejaVu", "bold"); } catch { doc.setFont("helvetica", "bold"); }
  doc.text("Connect:", margin, centerY);
  let x = margin + doc.getTextWidth("Connect:") + 16;

  const icons = [
    { b64: iconInstagramB64, url: "https://www.instagram.com/chandhinihirers_nellore/" },
    { b64: iconYouTubeB64, url: "https://www.youtube.com/@chandhinihirers_nellore" },
    { b64: iconMapPinB64, url: "https://maps.app.goo.gl/o3orgsRNWrdUJZh76" },
  ];

  icons.forEach((ico) => {
    if (ico.b64) {
      doc.addImage(`data:image/png;base64,${ico.b64}`, "PNG", x, centerY - iconSize + 2, iconSize, iconSize);
      doc.link(x, centerY - iconSize + 2, iconSize, iconSize, { url: ico.url });
      x += iconSize + gap;
    }
  });
}

/* ==================== PDF Builder =========================== */
export async function generateCartPdfBytes({
  title = "Chandini Hirers",
  lines,
  totalItems,
  totalAmount,
  customer,
}: {
  title?: string;
  lines: Line[];
  totalItems: number;
  totalAmount: number;
  customer?: { name: string; phone: string; address: string };
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  await ensureFonts(doc);
  await ensureIcons();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  const colItemX = margin + 10;
  const colQtyX = pageWidth - 180;
  const colAmtRight = pageWidth - margin;
  const RIGHT: TextOptionsLight = { align: "right" } as const;
  const dateStr = new Date().toISOString().slice(0, 16).replace("T", " ");

  // ---------- spacing & metrics ----------
  const FONT_SIZE_BODY = 11;
  const LINE_H = 14;
  const DETAILS_TABLE_GAP = 18;
  const HEADER_BAR_HEIGHT = 26;
  const HEADER_TEXT_VOFFSET = 18;
  const HEADER_ITEMS_GAP = 12;
  const ROW_MIN_H = 28;
  const ROW_GAP = 8;
  const IMG_SIZE = 28;

  // ------- image loader -------
  const imageCache = new Map<string, string>();
  async function getItemImageB64(url: string): Promise<string | null> {
    const key = url;
    if (imageCache.has(key)) return imageCache.get(key)!;
    try {
      const res = await fetch(withBase(url), { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      const b64 = await toBase64(buf);
      const dataUrl = `data:image/jpeg;base64,${b64}`;
      imageCache.set(key, dataUrl);
      return dataUrl;
    } catch {
      return null;
    }
  }

  const drawHeader = () => {
    drawTiledDiagonalWatermark(doc, "chandini hirers");

    // Title
    doc.setFontSize(16);
    try { doc.setFont("DejaVu", "bold"); } catch { doc.setFont("helvetica", "bold"); }
    doc.text(title, margin, margin + 10);

    // Details
    doc.setFontSize(11);
    try { doc.setFont("DejaVu", "normal"); } catch { doc.setFont("helvetica", "normal"); }

    const labels = ["Generated:", "Customer:", "Phone:", "Address:"];
    const labelPad = 8;
    const maxLabelW = Math.max(...labels.map((l) => doc.getTextWidth(l)));
    const valueX = margin + maxLabelW + labelPad;

    let y = margin + 28;

    // Generated
    doc.text("Generated:", margin, y);
    doc.text(dateStr, valueX, y);
    y += LINE_H;

    // Customer
    if (customer?.name) {
      doc.text("Customer:", margin, y);
      doc.text(String(customer.name), valueX, y);
      y += LINE_H;
    }

    // Phone
    if (customer?.phone) {
      doc.text("Phone:", margin, y);
      doc.text(String(customer.phone), valueX, y);
      y += LINE_H;
    }

    // Address
    if (customer?.address) {
      const addrLines = doc.splitTextToSize(String(customer.address), pageWidth - valueX - margin) as string[];
      doc.text("Address:", margin, y);
      if (addrLines.length > 0) {
        doc.text(addrLines[0], valueX, y);
        for (let i = 1; i < addrLines.length; i++) {
          y += LINE_H - 2;
          doc.text(addrLines[i], valueX, y);
        }
      }
      y += 6;
    }

    // Table header
    const thTop = Math.max(y + DETAILS_TABLE_GAP, margin + 70);
    const thLeft = margin;
    const thWidth = pageWidth - margin * 2;

    doc.setFillColor(240, 240, 240);
    doc.rect(thLeft, thTop, thWidth, HEADER_BAR_HEIGHT, "F");

    try { doc.setFont("DejaVu", "bold"); } catch { doc.setFont("helvetica", "bold"); }
    const thBaseline = thTop + HEADER_TEXT_VOFFSET;
    doc.text("Item", colItemX, thBaseline);
    doc.text("Qty", colQtyX, thBaseline);
    doc.text("Amount", colAmtRight, thBaseline, RIGHT);

    return thTop + HEADER_BAR_HEIGHT + HEADER_ITEMS_GAP + LINE_H;
  };

  let y = drawHeader();

  const textX = margin + IMG_SIZE + 8;
  const nameColumnWidth = colQtyX - textX - 10;

  try { doc.setFont("DejaVu", "normal"); } catch { doc.setFont("helvetica", "normal"); }
  doc.setFontSize(FONT_SIZE_BODY);

  for (const l of lines) {
    if (y > pageHeight - margin - 120) {
      addFooterIcons(doc);
      doc.addPage();
      y = drawHeader();
      try { doc.setFont("DejaVu", "normal"); } catch { doc.setFont("helvetica", "normal"); }
      doc.setFontSize(FONT_SIZE_BODY);
    }

    const priceStr = formatINR(l.item.price, fontsOk);
    const amountStr = formatINR(l.lineTotal, fontsOk);
    const imgUrl = l.item.previewImage || l.item.imageAssets?.[0] || "/images/placeholder.jpeg";

    const wrapped = doc.splitTextToSize(`${l.item.name} (${priceStr})`, nameColumnWidth) as string[];
    const textBlockH = Math.max(LINE_H, wrapped.length * LINE_H);
    const rowH = Math.max(ROW_MIN_H, textBlockH, IMG_SIZE);

    const rowTop = y - LINE_H;
    const rowBottom = rowTop + rowH;

    const imgY = rowTop + (rowH - IMG_SIZE) / 2;
    if (imgUrl) {
      try {
        const b64 = await getItemImageB64(imgUrl);
        if (b64) doc.addImage(b64, "JPEG", margin, imgY, IMG_SIZE, IMG_SIZE);
      } catch { }
    }

    const textTop = rowTop + (rowH - textBlockH) / 2;
    const BASELINE_OFFSET = FONT_SIZE_BODY;
    const textBaseline = textTop + BASELINE_OFFSET;

    doc.text(wrapped, textX, textBaseline);
    doc.text(String(l.qty), colQtyX, textBaseline);
    doc.text(amountStr, colAmtRight, textBaseline, RIGHT);

    y = rowBottom + ROW_GAP + LINE_H;
  }

  // Totals
  y += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  try { doc.setFont("DejaVu", "bold"); } catch { doc.setFont("helvetica", "bold"); }
  doc.text("Total Items:", pageWidth - 250, y);
  doc.text(String(totalItems), colAmtRight, y, RIGHT);
  y += ROW_MIN_H;

  const totalText =
    fontsOk ? INR0.format(totalAmount) : "Rs " + Math.round(totalAmount).toLocaleString("en-IN");
  doc.text("Total Amount:", pageWidth - 250, y);
  doc.text(totalText, colAmtRight, y, RIGHT);

  addFooterIcons(doc);
  return doc.output("arraybuffer");
}

/* ===================== Filename builder ====================== */
function pad2(n: number) { return n < 10 ? `0${n}` : String(n); }

function sanitizeName(name?: string) {
  const n = (name || "order").trim().toLowerCase();
  // keep letters, numbers, hyphen/underscore; collapse spaces to hyphen
  return n.replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "").replace(/-+/g, "-") || "order";
}

/** e.g. "chandini-06-03-2025-19-20.pdf" */
export function buildPdfFilename(customerName?: string, d: Date = new Date()) {
  const name = sanitizeName(customerName);
  const DD = pad2(d.getDate());
  const MM = pad2(d.getMonth() + 1);
  const YYYY = d.getFullYear();
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${name}-${DD}-${MM}-${YYYY}-${hh}-${mm}.pdf`;
}


/* ===================== Robust Downloader ===================== */
export function robustDownloadPdf(bytes: ArrayBuffer, filename?: string, customerNameForFallback?: string) {
  try {
    // fallback filename if not provided
    const finalName = filename && filename.trim().length > 0 ? filename : buildPdfFilename(customerNameForFallback);

    const blob = new Blob([bytes], { type: "application/pdf" });
    const nav = navigator as NavigatorWithMsSave;
    if (typeof nav.msSaveOrOpenBlob === "function") {
      nav.msSaveOrOpenBlob(blob, finalName);
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
    if (!isIOS) a.download = finalName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1000);
  } catch {
    alert("Could not download the PDF. Please try again.");
  }
}
