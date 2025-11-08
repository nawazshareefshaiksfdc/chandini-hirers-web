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

export type CustomerFormProps = {
  value: CustomerForm;
  onChange: (next: CustomerForm) => void;
  onSubmit?: (validForm: CustomerForm) => void;
  editing?: boolean;
  showHeader?: boolean;
  /** NEW: header action callbacks */
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

async function apiUnshorten(u: string): Promise<string | null> {
  try {
    const r = await fetch(`/api/maps/unshorten?u=${encodeURIComponent(u)}`);
    const j = await r.json();
    return j?.finalUrl ?? null;
  } catch {
    return null;
  }
}

async function apiGeocode(location: string): Promise<string | null> {
  try {
    const r = await fetch(`/api/maps/geocode?location=${encodeURIComponent(location)}`);
    const j = await r.json();
    const addr = j?.results?.[0]?.formatted_address as string | undefined;
    return addr ?? null;
  } catch {
    return null;
  }
}

export default function CustomerFormCard({
  value,
  onChange,
  onSubmit,
  editing = true,
  showHeader = false,
  onEdit,
  onDelete,
}: CustomerFormProps) {
  const [touched, setTouched] = useState<Record<keyof CustomerForm, boolean>>({} as any);
  const [autoFillAddress, setAutoFillAddress] = useState(true);

  const { valid } = useMemo(() => validateCustomer(value), [value]);

  const [mapEmbed, setMapEmbed] = useState<string | null>(null);
  const [isShortMap, setIsShortMap] = useState(false);
  const [lastGuess, setLastGuess] = useState<string | null>(null);

  // ---- Map input normalization / preview / autofill ----
  useEffect(() => {
    let canceled = false;

    (async () => {
      // reset if empty
      if (!value.mapUrl) {
        if (canceled) return;
        setMapEmbed(null);
        setIsShortMap(false);
        setLastGuess(null);
        return;
      }

      let working = value.mapUrl;

      // 1) expand maps.app.goo.gl short links (await safely inside IIFE)
      if (isGoogleShortLink(working)) {
        const finalUrl = await apiUnshorten(working);
        if (canceled) return;
        if (finalUrl && finalUrl !== working) {
          // trigger another run of this effect with the expanded URL
          onChange({ ...value, mapUrl: finalUrl });
          return;
        }
      }

      // 2) DMS pair -> embed + optional reverse geocode
      const dms = parseDMSPair(working);
      if (dms) {
        const embed = buildEmbedFromLatLng(dms.lat, dms.lng);
        if (canceled) return;
        setMapEmbed(embed);
        setIsShortMap(false);
        setLastGuess(`${dms.lat}, ${dms.lng}`);

        if (autoFillAddress && (!value.address || value.address.trim().length < 6)) {
          const addr = await apiGeocode(`${dms.lat},${dms.lng}`);
          if (!canceled && addr) onChange({ ...value, address: addr });
        }
        return;
      }

      // 3) decimal pair -> embed + optional reverse geocode
      const dec = parseDecimalPair(working);
      if (dec) {
        const embed = buildEmbedFromLatLng(dec.lat, dec.lng);
        if (canceled) return;
        setMapEmbed(embed);
        setIsShortMap(false);
        setLastGuess(`${dec.lat}, ${dec.lng}`);

        if (autoFillAddress && (!value.address || value.address.trim().length < 6)) {
          const addr = await apiGeocode(`${dec.lat},${dec.lng}`);
          if (!canceled && addr) onChange({ ...value, address: addr });
        }
        return;
      }

      // 4) anything else -> normalize + try to extract coords/address
      const norm = normalizeMapInput(working);
      if (canceled) return;
      setMapEmbed(norm.embedSrc);
      setIsShortMap(norm.shortLink);

      const latLng = norm.embedSrc ? extractLatLngFromEmbed(norm.embedSrc) : null;
      if (latLng) {
        setLastGuess(`${latLng.lat}, ${latLng.lng}`);
        if (autoFillAddress && (!value.address || value.address.trim().length < 6)) {
          const addr = await apiGeocode(`${latLng.lat},${latLng.lng}`);
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
  }, [value.mapUrl]);
const minNow = useMemo(() => {
  const d = new Date();
  d.setSeconds(0, 0);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}, []);
  const setField = <K extends keyof CustomerForm>(key: K, v: CustomerForm[K]) =>
    onChange({ ...value, [key]: v });

  // ---- Toolbar actions (outside the input) ----
  const handleSyncAddress = async () => {
    const latLng = mapEmbed ? extractLatLngFromEmbed(mapEmbed) : null;
    if (latLng) {
      const addr = await apiGeocode(`${latLng.lat},${latLng.lng}`);
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
        const addr = await apiGeocode(`${latitude},${longitude}`);
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

          {/* NEW: Header Actions */}
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

        <InputField
          label="WhatsApp Phone (with country code, numbers only)"
          placeholder="e.g., 9198XXXXXXXX"
          value={value.phone}
          disabled={!editing}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setField("phone", e.target.value.replace(/[^\d]/g, ""))
          }
          onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
          invalid={!!touched.phone && !validators.phone(value.phone)}
          hint="10–15 digits with country code."
          onClear={() => setField("phone", "")}
        />
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
      // if end exists but is not after new start, bump end = start + 1 hour
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

{/* Row 3 — End (To) alone to keep layout tidy */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  {/* Left cell empty on large screens to align nicely; remove if you prefer */}
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

      {/* Map URL + right-side toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col">
          <label className="text-xs text-gray-400 mb-1">Google Map URL / iframe / coordinates (optional)</label>

          <div className="flex items-stretch gap-2">
            {/* Input */}
            <input
              className={uiFieldClass(!!touched.mapUrl && !validators.mapUrlOptional(value.mapUrl), editing) + " flex-1"}
              placeholder={`Paste link, iframe, "lat,lng" or DMS like 14°25'32.5"N 79°57'21.1"E`}
              value={value.mapUrl}
              disabled={!editing}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("mapUrl", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, mapUrl: true }))}
            />

            {/* Right toolbar */}
            <div className="flex items-center gap-1">
              {/* Clear map */}
              <button
                type="button"
                title="Clear map"
                aria-label="Clear map"
                onClick={clearMapUrl}
                disabled={!editing || !value.mapUrl}
                className="px-2 py-1.5 rounded-md border border-gray-700 text-gray-300 hover:bg-[#1b2340] disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Use my location */}
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

              {/* Sync parsed address */}
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
              Short link detected. It will auto-expand server-side; if preview or address looks wrong,
              open the short link once and paste the full Google Maps URL or the “Embed map” iframe.
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
            Auto-fill Address from Map input
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
                orderDateTime: true,
                address: true,
                mapUrl: true,
              } as any);
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
