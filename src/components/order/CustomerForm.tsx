"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { CustomerForm } from "@/types/order";
import { validateCustomer, validators } from "@/lib/validation/customer";
import {
  normalizeMapInput,
  extractLatLngFromEmbed,
  isGoogleShortLink,
  parseDMSPair,
  parseDecimalPair,
  buildEmbedFromLatLng,
} from "@/lib/maps";
import { InputField, TextareaField, SelectField, uiFieldClass } from "@/components/ui/Field";
import { RefreshCcw, LocateFixed, X, Pen, Trash2 } from "lucide-react";

/* =================== Config =================== */
// ❗ Use a REFERRER-restricted browser key only:
const PUBLIC_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/* ✅ Fixed country code for India */
const PHONE_CC = "91"; // stored as: 91XXXXXXXXXX (digits only)

/* ============ Client-only helpers ============ */
/** No server in static Pages, so we can't truly unshorten safely. */
async function clientUnshortenNoop(_u: string): Promise<string | null> {
  void _u;
  return null;
}

/** Optional client-side geocode (only if a safe NEXT_PUBLIC key is provided). */
async function clientGeocodeOptional(location: string): Promise<string | null> {
  if (!PUBLIC_MAPS_KEY) return null;
  try {
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${PUBLIC_MAPS_KEY}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    const addr = j?.results?.[0]?.formatted_address as string | undefined;
    return addr ?? null;
  } catch {
    return null;
  }
}

/* =================== UI Component =================== */

export type CustomerFormProps = {
  value: CustomerForm;
  onChange: (next: CustomerForm) => void;
  onSubmit?: (validForm: CustomerForm) => void;
  editing?: boolean;
  showHeader?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

const EVENT_OPTIONS = [
  "Marriage",
  "Reception",
  "Haldhi Birthday",
  "Ceremony",
  "School/College event",
  "Death",
  "Karumantram",
  "House opening",
  "Festival",
  "Others",
];

export default function CustomerFormCard({
  value,
  onChange,
  onSubmit,
  editing = true,
  showHeader = false,
  onEdit,
  onDelete,
}: CustomerFormProps) {
  const initialTouched: Record<keyof CustomerForm, boolean> = {
    name: false,
    phone: false,
    eventType: false,
    startDateTime: false,
    endDateTime: false,
    address: false,
    mapUrl: false,
  };

  const [touched, setTouched] =
    useState<Record<keyof CustomerForm, boolean>>(initialTouched);
  const [autoFillAddress, setAutoFillAddress] = useState(true);

  const { valid } = useMemo(() => validateCustomer(value), [value]);

  const [mapEmbed, setMapEmbed] = useState<string | null>(null);
  const [isShortMap, setIsShortMap] = useState(false);
  const [lastGuess, setLastGuess] = useState<string | null>(null);

  // ✅ local-part for UI (10 digits). Stored value remains digits-only with CC: "91" + local
  const phoneLocal = useMemo(() => {
    const raw = (value.phone ?? "").replace(/[^\d]/g, "");
    if (!raw) return "";
    return raw.startsWith(PHONE_CC) ? raw.slice(PHONE_CC.length) : raw;
  }, [value.phone]);

  const setField = <K extends keyof CustomerForm>(key: K, v: CustomerForm[K]) =>
    onChange({ ...value, [key]: v });

  // ---- Map input normalization / preview / autofill ----
  useEffect(() => {
    let canceled = false;

    (async () => {
      if (!value.mapUrl) {
        if (canceled) return;
        setMapEmbed(null);
        setIsShortMap(false);
        setLastGuess(null);
        return;
      }

      const working = value.mapUrl;

      // 1) Short links: without a server we *cannot* expand. Try a noop, keep UX note.
      if (isGoogleShortLink(working)) {
        const finalUrl = await clientUnshortenNoop(working);
        if (canceled) return;
        if (finalUrl && finalUrl !== working) {
          onChange({ ...value, mapUrl: finalUrl });
          return;
        }
      }

      // 2) DMS
      const dms = parseDMSPair(working);
      if (dms) {
        const embed = buildEmbedFromLatLng(dms.lat, dms.lng);
        if (canceled) return;
        setMapEmbed(embed);
        setIsShortMap(false);
        setLastGuess(`${dms.lat}, ${dms.lng}`);

        if (autoFillAddress && (!value.address || value.address.trim().length < 6)) {
          const addr = await clientGeocodeOptional(`${dms.lat},${dms.lng}`);
          if (!canceled && addr) onChange({ ...value, address: addr });
        }
        return;
      }

      // 3) Decimal pair
      const dec = parseDecimalPair(working);
      if (dec) {
        const embed = buildEmbedFromLatLng(dec.lat, dec.lng);
        if (canceled) return;
        setMapEmbed(embed);
        setIsShortMap(false);
        setLastGuess(`${dec.lat}, ${dec.lng}`);

        if (autoFillAddress && (!value.address || value.address.trim().length < 6)) {
          const addr = await clientGeocodeOptional(`${dec.lat},${dec.lng}`);
          if (!canceled && addr) onChange({ ...value, address: addr });
        }
        return;
      }

      // 4) Generic URL/iframe
      const norm = normalizeMapInput(working);
      if (canceled) return;
      setMapEmbed(norm.embedSrc);
      setIsShortMap(norm.shortLink);

      const latLng = norm.embedSrc ? extractLatLngFromEmbed(norm.embedSrc) : null;
      if (latLng) {
        setLastGuess(`${latLng.lat}, ${latLng.lng}`);
        if (autoFillAddress && (!value.address || value.address.trim().length < 6)) {
          const addr = await clientGeocodeOptional(`${latLng.lat},${latLng.lng}`);
          if (!canceled && addr) onChange({ ...value, address: addr });
        }
      } else {
        setLastGuess(norm.addressGuess || null);
        if (autoFillAddress && norm.addressGuess && (!value.address || value.address.trim().length < 6)) {
          onChange({ ...value, address: norm.addressGuess });
        }
      }
    })();

    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.mapUrl, autoFillAddress]);

  const minNow = useMemo(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, []);

  // ---- Toolbar actions (outside the input) ----
  const handleSyncAddress = async () => {
    const latLng = mapEmbed ? extractLatLngFromEmbed(mapEmbed) : null;
    if (latLng) {
      const addr = await clientGeocodeOptional(`${latLng.lat},${latLng.lng}`);
      if (addr) return onChange({ ...value, address: addr });
      return onChange({ ...value, address: `${latLng.lat}, ${latLng.lng}` });
    }
    if (lastGuess) onChange({ ...value, address: lastGuess });
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation is not supported.");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const embed = buildEmbedFromLatLng(latitude, longitude);
        const addr = await clientGeocodeOptional(`${latitude},${longitude}`);
        onChange({
          ...value,
          mapUrl: `${latitude},${longitude}`,
          address: addr ?? value.address,
        });
        setMapEmbed(embed);
        setLastGuess(`${latitude}, ${longitude}`);
      },
      () => {
        alert("Unable to fetch current location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clearMapUrl = () => {
    onChange({ ...value, mapUrl: "" });
    setMapEmbed(null);
    setLastGuess(null);
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-[#101729] p-4 space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">Customer Details</h3>

          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Edit form"
              aria-label="Edit form"
              onClick={() => onEdit?.()}
              className="px-2 py-1.5 rounded-md border border-gray-700 text-gray-300 hover:bg-[#1b2340]"
            >
              <Pen className="w-4 h-4" />
            </button>

            <button
              type="button"
              title="Delete form"
              aria-label="Delete form"
              onClick={() => onDelete?.()}
              className="px-2 py-1.5 rounded-md border border-red-700 text-red-300 hover:bg-[#2a1320]"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InputField
          label="Full Name"
          placeholder="e.g., user"
          value={value.name}
          disabled={!editing}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("name", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          invalid={!!touched.name && !validators.name(value.name)}
          hint="Enter at least 2 characters."
          onClear={() => setField("name", "")}
        />

        {/* ✅ Phone with fixed +91 prefix (UI) and digits-only storage (value.phone) */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-400 mb-1">
            WhatsApp Phone (India)
          </label>

          <div className="relative">
            <div className="flex">
              <div
                className="px-3 py-2 rounded-l-md border border-gray-700 bg-[#0c1323] text-gray-200 text-sm flex items-center"
              >
                +91
              </div>

              <input
                className={
                  // same style as other fields, but remove left radius & add space for clear button
                  uiFieldClass(!!touched.phone && !validators.phone(value.phone), !(!editing)) +
                  " rounded-l-none pr-10"
                }
                placeholder="e.g., 98XXXXXXXX"
                value={phoneLocal}
                disabled={!editing}
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  // user types only local digits
                  let digits = e.target.value.replace(/[^\d]/g, "");

                  // if user pastes 91xxxxxxxxxx into local box, normalize it
                  if (digits.startsWith(PHONE_CC)) digits = digits.slice(PHONE_CC.length);

                  // keep max 10 local digits
                  digits = digits.slice(0, 10);

                  // store full digits-only with CC
                  setField("phone", digits ? (PHONE_CC + digits) : "");
                }}
                onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              />

              {/* ✅ show clear only when local part has digits */}
              {editing && phoneLocal.trim().length > 0 && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#1b2340]"
                  onClick={() => setField("phone", "")}
                  aria-label="Clear"
                  title="Clear"
                >
                  <X className="w-4 h-4 text-gray-300" />
                </button>
              )}
            </div>
          </div>

          {touched.phone && !validators.phone(value.phone) && (
            <p className="mt-1 text-[11px] text-amber-300">
              Enter a valid number (stored as 91XXXXXXXXXX).
            </p>
          )}
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SelectField
          label="Event Type"
          value={value.eventType}
          disabled={!editing}
          onChange={(e) => setField("eventType", (e.target as HTMLSelectElement).value)}
          onBlur={() => setTouched((t) => ({ ...t, eventType: true }))}
          invalid={!!touched.eventType && !validators.eventType(value.eventType)}
          hint="Please select an event"
        >
          <option value="">Select an event</option>
          {EVENT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </SelectField>

        {/* Start (From) */}
        <InputField
          type="datetime-local"
          label="Start (From)"
          value={value.startDateTime}
          min={minNow}
          disabled={!editing}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const nextStart = e.target.value;
            const s = new Date(nextStart.replace("T", " ") + ":00");
            const eDate = value.endDateTime ? new Date(value.endDateTime.replace("T", " ") + ":00") : null;
            let nextEnd = value.endDateTime;

            if (s.toString() !== "Invalid Date") {
              if (!eDate || eDate.getTime() <= s.getTime()) {
                const tmp = new Date(s.getTime() + 60 * 60 * 1000);
                const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
                nextEnd = `${tmp.getFullYear()}-${pad(tmp.getMonth() + 1)}-${pad(tmp.getDate())}T${pad(tmp.getHours())}:${pad(tmp.getMinutes())}`;
              }
            }
            onChange({ ...value, startDateTime: nextStart, endDateTime: nextEnd });
          }}
          onBlur={() => setTouched((t) => ({ ...t, startDateTime: true }))}
          invalid={!!touched.startDateTime && !validators.startDateTime(value.startDateTime)}
          hint="Must be a future date & time"
          onClear={() => setField("startDateTime", "")}
        />
      </div>

      {/* Row 3 — End (To) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="hidden sm:block" />
        <InputField
          type="datetime-local"
          label="End (To)"
          value={value.endDateTime}
          min={value.startDateTime || minNow}
          disabled={!editing}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("endDateTime", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, endDateTime: true }))}
          invalid={!!touched.endDateTime && !validators.endDateTime(value.endDateTime, value.startDateTime)}
          hint="Must be after Start and in the future"
          onClear={() => setField("endDateTime", "")}
        />
      </div>

      {/* Address */}
      <TextareaField
        label="Address"
        placeholder="House / Street, Area, City, State, PIN"
        value={value.address}
        disabled={!editing}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setField("address", e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, address: true }))}
        invalid={!!touched.address && !validators.address(value.address)}
        hint="At least 6 characters"
        onClear={() => setField("address", "")}
      />

      {/* Map URL + right toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col">
          <label className="text-xs text-gray-400 mb-1">
            Google Map URL / iframe / coordinates (optional)
          </label>

          <div className="flex items-stretch gap-2">
            <input
              className={uiFieldClass(!!touched.mapUrl && !validators.mapUrlOptional(value.mapUrl), editing) + " flex-1"}
              placeholder={`Paste link, iframe, "lat,lng" or DMS like 14°25'32.5"N 79°57'21.1"E`}
              value={value.mapUrl}
              disabled={!editing}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("mapUrl", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, mapUrl: true }))}
            />

            <div className="flex items-center gap-1">
              {editing && value.mapUrl?.trim() ? (
                <button
                  type="button"
                  title="Clear map"
                  aria-label="Clear map"
                  onClick={clearMapUrl}
                  className="px-2 py-1.5 rounded-md border border-gray-700 text-gray-300 hover:bg-[#1b2340]"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}

              <button
                type="button"
                title="Use my current location"
                aria-label="Use my location"
                onClick={handleUseMyLocation}
                disabled={!editing}
                className="px-2 py-1.5 rounded-md border border-gray-700 text-gray-300 hover:bg-[#1b2340] disabled:opacity-40"
              >
                <LocateFixed className="w-4 h-4" />
              </button>

              <button
                type="button"
                title="Sync parsed location into Address"
                aria-label="Sync location"
                onClick={handleSyncAddress}
                disabled={!editing || (!lastGuess && !mapEmbed)}
                className="px-2 py-1.5 rounded-md border border-gray-700 text-gray-300 hover:bg-[#1b2340] disabled:opacity-40"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isShortMap && (
            <p className="mt-1 text-[11px] text-amber-300">
              Short link detected. Static deploys can’t expand short links. Open it once and paste the full Google Maps URL or the “Embed map” iframe.
            </p>
          )}

          {!!touched.mapUrl && !validators.mapUrlOptional(value.mapUrl) && (
            <p className="mt-1 text-[11px] text-amber-300">
              Must be a Google Maps URL/iframe, a decimal pair like <code>18.440093, 79.106421</code>,
              or a DMS pair like <code>18°26&apos;24.3&quot;N 79°06&apos;23.1&quot;E</code>.
            </p>
          )}

          {lastGuess && (
            <p className="mt-1 text-[11px] text-gray-400">
              Parsed location: <span className="text-gray-200">{lastGuess}</span>
            </p>
          )}
        </div>

        {/* Auto-fill toggle */}
        <div className="flex flex-col justify-end">
          <label className="inline-flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 accent-blue-600"
              checked={autoFillAddress}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAutoFillAddress(e.target.checked)}
            />
            Auto-fill Address from Map input {PUBLIC_MAPS_KEY ? "(via Geocoding API)" : "(no geocoding—uses coords)"}
          </label>
        </div>
      </div>

      {/* Map preview */}
      {mapEmbed && (
        <div>
          <p className="text-[12px] text-gray-400">Map preview</p>
          <iframe
            src={mapEmbed}
            className="w-full h-[300px] rounded-lg border border-gray-800 bg-[#0c1323]"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

      {!valid && (
        <p className="text-xs text-amber-300">
          Please fill all required fields correctly (name, phone, event, date/time, address).
        </p>
      )}

      {onSubmit && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-2 rounded-md bg-[color:var(--color-primary)] text-white text-sm hover:saturate-125 disabled:opacity-40"
            onClick={() => {
              setTouched({
                name: true,
                phone: true,
                eventType: true,
                startDateTime: true,
                endDateTime: true,
                address: true,
                mapUrl: true,
              });
              const check = validateCustomer(value);
              if (check.valid) onSubmit(value);
            }}
            disabled={!editing}
          >
            Save details
          </button>
        </div>
      )}
    </div>
  );
}
