export type NormalizedMap = {
  embedSrc: string | null;     // safe for <iframe src>
  addressGuess: string | null; // best-effort text or "lat,lng"
  shortLink: boolean;          // maps.app.goo.gl?
};

const udecode = (v: string) => { try { return decodeURIComponent(v.replace(/\+/g, " ")); } catch { return v; } };

export function isGoogleShortLink(url: string): boolean {
  try { return new URL(url.trim()).hostname === "maps.app.goo.gl"; } catch { return false; }
}

// DMS like: 14°25'32.5"N 79°57'21.1"E
export function parseDMSPair(input: string): { lat: number; lng: number } | null {
  const clean = input.trim().replace(/,/g, " ").replace(/\s+/g, " ");
  const dmsRe = /(-?\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)?\D*(\d+(?:\.\d+)?)?\s*([NS])\s+(-?\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)?\D*(\d+(?:\.\d+)?)?\s*([EW])/i;
  const m = clean.match(dmsRe);
  if (!m) return null;

  const toDec = (deg: string, min?: string, sec?: string, hemi?: string) => {
    const d = parseFloat(deg || "0");
    const mi = parseFloat(min || "0");
    const s = parseFloat(sec || "0");
    let dec = Math.abs(d) + mi / 60 + s / 3600;
    if ((hemi || "").toUpperCase() === "S" || (hemi || "").toUpperCase() === "W" || d < 0) dec = -dec;
    return dec;
  };

  const lat = toDec(m[1], m[2], m[3], m[4]);
  const lng = toDec(m[5], m[6], m[7], m[8]);
  if (isFinite(lat) && isFinite(lng)) return { lat, lng };
  return null;
}

// decimal pair "lat,lng"
export function parseDecimalPair(input: string): { lat: number; lng: number } | null {
  const m = input.trim().match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (isFinite(lat) && isFinite(lng)) return { lat, lng };
  return null;
}

export function buildEmbedFromLatLng(lat: number, lng: number, zoom = 14): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&hl=en&z=${zoom}&output=embed`;
}

// Extract lat/lng from common embed shapes
export function extractLatLngFromEmbed(src: string): { lat: number; lng: number } | null {
  const m = src.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
  const at = src.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),\d+z/);
  if (at) return { lat: Number(at[1]), lng: Number(at[2]) };
  return null;
}

// Guess readable address from Google Maps URL
export function guessAddressFromMapUrl(url: string): string | null {
  try {
    if (url.trim().startsWith("<iframe")) {
      const m = url.match(/\ssrc\s*=\s*"(.*?)"/i);
      if (m?.[1]) return guessAddressFromMapUrl(m[1]);
    }

    const u = new URL(url);
    const path = u.pathname;

    if (/^\/maps\/embed/i.test(path)) {
      const ll = extractLatLngFromEmbed(url);
      if (ll) return `${ll.lat}, ${ll.lng}`;
      const q = u.searchParams.get("q");
      return q ? udecode(q) : null;
    }

    const placeIdx = path.toLowerCase().indexOf("/place/");
    if (placeIdx >= 0) {
      const rest = path.slice(placeIdx + "/place/".length);
      const namePart = rest.split("/")[0];
      if (namePart) return udecode(namePart.replace(/\+/g, " ").replace(/-/g, " "));
    }

    const q = u.searchParams.get("q");
    if (q) return udecode(q);

    const atIdx = path.indexOf("@");
    if (atIdx >= 0) {
      const coords = path.slice(atIdx + 1).split(",").slice(0, 2).join(", ");
      if (coords) return coords;
    }

    if (u.hostname === "maps.app.goo.gl") return null;

    const segs = path.split("/").filter(Boolean);
    if (segs.length) return udecode(segs[segs.length - 1]);

    return null;
  } catch {
    return null;
  }
}

export function buildEmbedFromMapInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Do NOT build an embed for short links; the caller should unshorten first.
  try { if (new URL(trimmed).hostname === "maps.app.goo.gl") return null; } catch {}

  const dms = parseDMSPair(trimmed);
  if (dms) return buildEmbedFromLatLng(dms.lat, dms.lng);

  const dec = parseDecimalPair(trimmed);
  if (dec) return buildEmbedFromLatLng(dec.lat, dec.lng);

  if (trimmed.startsWith("<iframe")) {
    const m = trimmed.match(/\ssrc\s*=\s*"(.*?)"/i);
    return m?.[1] ?? null;
  }
  if (/^https?:\/\/www\.google\.[^/]+\/maps\/embed/i.test(trimmed)) return trimmed;

  try {
    const addr = guessAddressFromMapUrl(trimmed);
    const q = encodeURIComponent(addr ?? trimmed);
    return `https://www.google.com/maps?q=${q}&hl=en&z=14&output=embed`;
  } catch {
    return null;
  }
}


export function normalizeMapInput(input: string): NormalizedMap {
  const embedSrc = buildEmbedFromMapInput(input);

  // ← fixed: compute addressGuess without any bogus `.let`
  let addressGuess: string | null = null;
  const dms = parseDMSPair(input);
  if (dms) {
    addressGuess = `${dms.lat}, ${dms.lng}`;
  } else {
    const dec = parseDecimalPair(input);
    if (dec) {
      addressGuess = `${dec.lat}, ${dec.lng}`;
    } else {
      addressGuess = guessAddressFromMapUrl(input);
    }
  }

  let shortLink = false;
  try { shortLink = new URL(input.trim()).hostname === "maps.app.goo.gl"; } catch {}

  return { embedSrc, addressGuess: addressGuess ?? null, shortLink };
}
