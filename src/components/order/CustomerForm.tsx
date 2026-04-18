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

const PUBLIC_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const PHONE_CC = "91";

const INITIAL_TOUCHED: Record<keyof CustomerForm, boolean> = {
  name: false,
  phone: false,
  eventType: false,
  startDateTime: false,
  endDateTime: false,
  address: false,
  mapUrl: false,
};

async function clientUnshortenNoop(_u: string): Promise<string | null> {
  void _u;
  return null;
}

async function clientGeocodeOptional(location: string): Promise<string | null> {
  if (!PUBLIC_MAPS_KEY) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${PUBLIC_MAPS_KEY}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    const addr = j?.results?.[0]?.formatted_address as string | undefined;
    return addr ?? null;
  } catch {
    return null;
  }
}

function normalizeIndianPhoneInput(raw: string) {
  let digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) {
    digits = digits.replace(/^0+/, "");
  }
  if (digits.startsWith(PHONE_CC)) {
    return digits.slice(0, 12);
  }
  return (PHONE_CC + digits).slice(0, 12);
}

function getDisplayPhone(raw?: string) {
  return (raw ?? "").replace(/[^\d]/g, "");
}

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
  "Haldi",
  "Birthday",
  "Ceremony",
  "School/College event",
  "Death",
  "Karumantram",
  "House opening",
  "Festival",
  "Baby Shower",
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
  const [touched, setTouched] = useState<Record<keyof CustomerForm, boolean>>(INITIAL_TOUCHED);
  const [autoFillAddress, setAutoFillAddress] = useState(true);
  const [mapEmbed, setMapEmbed] = useState<string | null>(null);
  const [isShortMap, setIsShortMap] = useState(false);
  const [lastGuess, setLastGuess] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) setTouched(INITIAL_TOUCHED);
  }, [editing]);

  const hasAnyValue = useMemo(() => {
    return Object.entries(value as Record<string, unknown>).some(([, v]) => {
      if (typeof v === "string") return v.trim().length > 0;
      return v != null;
    });
  }, [value]);

  const phoneDisplay = useMemo(() => getDisplayPhone(value.phone), [value.phone]);

  const setField = <K extends keyof CustomerForm>(key: K, v: CustomerForm[K]) =>
    onChange({ ...value, [key]: v });

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
      if (isGoogleShortLink(working)) {
        const finalUrl = await clientUnshortenNoop(working);
        if (canceled) return;
        if (finalUrl && finalUrl !== working) {
          onChange({ ...value, mapUrl: finalUrl });
          return;
        }
      }

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
    <div className="ui-card space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Customer Details</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Edit form"
              aria-label="Edit form"
              onClick={() => onEdit?.()}
              className="ui-icon-btn"
            >
              <Pen className="h-4 w-4" />
            </button>
            {hasAnyValue && (
              <button
                type="button"
                title="Delete form"
                aria-label="Delete form"
                onClick={() => onDelete?.()}
                className="ui-icon-btn ui-btn-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InputField
          label="Full Name"
          placeholder="e.g., user"
          value={value.name}
          disabled={!editing}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("name", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          invalid={editing && !!touched.name && !validators.name(value.name)}
          hint="Enter at least 2 characters."
          onClear={() => setField("name", "")}
        />

        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="customer-phone" className="ui-label">
            WhatsApp Phone (India)
          </label>
          <div className="relative">
            <input
              id="customer-phone"
              className={
                uiFieldClass(editing && !!touched.phone && !validators.phone(value.phone), editing) + " pr-10"
              }
              placeholder="e.g., +919180234546 or 9180234546"
              value={phoneDisplay}
              disabled={!editing}
              inputMode="numeric"
              autoComplete="tel"
              maxLength={13}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const normalized = normalizeIndianPhoneInput(e.target.value);
                setField("phone", normalized);
              }}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              aria-invalid={editing && touched.phone && !validators.phone(value.phone)}
              aria-describedby={editing && touched.phone && !validators.phone(value.phone) ? "customer-phone-error" : undefined}
            />

            {editing && phoneDisplay.trim().length > 0 && (
              <button
                type="button"
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg transition-all duration-200 hover:bg-[color:var(--color-primary-weak)]"
                onClick={() => setField("phone", "")}
                aria-label="Clear"
                title="Clear"
              >
                <X className="h-4 w-4" style={{ color: "var(--color-muted)" }} />
              </button>
            )}
          </div>

          {editing && touched.phone && !validators.phone(value.phone) && (
            <p id="customer-phone-error" className="ui-error">
              Enter a valid Indian number like 9180234546 or +919180234546.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SelectField
          label="Event Type"
          value={value.eventType}
          disabled={!editing}
          onChange={(e) => setField("eventType", (e.target as HTMLSelectElement).value)}
          onBlur={() => setTouched((t) => ({ ...t, eventType: true }))}
          invalid={editing && !!touched.eventType && !validators.eventType(value.eventType)}
          hint="Please select an event"
        >
          <option value="">Select an event</option>
          {EVENT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </SelectField>

        <InputField
          type="datetime-local"
          label="Start (From)"
          value={value.startDateTime}
          disabled={!editing}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const nextStart = e.target.value;
            const s = new Date(nextStart.replace("T", " ") + ":00");
            const eDate = value.endDateTime ? new Date(value.endDateTime.replace("T", " ") + ":00") : null;
            let nextEnd = value.endDateTime;

            if (s.toString() !== "Invalid Date") {
              if (!eDate || eDate.getTime() <= s.getTime()) {
                const tmp = new Date(s.getTime() + 24 * 60 * 60 * 1000);
                const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
                nextEnd = `${tmp.getFullYear()}-${pad(tmp.getMonth() + 1)}-${pad(tmp.getDate())}T${pad(tmp.getHours())}:${pad(tmp.getMinutes())}`;
              }
            }

            onChange({ ...value, startDateTime: nextStart, endDateTime: nextEnd });
          }}
          onBlur={() => setTouched((t) => ({ ...t, startDateTime: true }))}
          invalid={editing && !!touched.startDateTime && !validators.startDateTime(value.startDateTime)}
          onClear={() => setField("startDateTime", "")}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="hidden sm:block" />
        <InputField
          type="datetime-local"
          label="End (To)"
          value={value.endDateTime}
          min={value.startDateTime || undefined}
          disabled={!editing}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("endDateTime", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, endDateTime: true }))}
          invalid={editing && !!touched.endDateTime && !validators.endDateTime(value.endDateTime, value.startDateTime)}
          hint="Must be after Start"
          onClear={() => setField("endDateTime", "")}
        />
      </div>

      <TextareaField
        label="Address"
        placeholder="House / Street, Area, City, State, PIN"
        value={value.address}
        disabled={!editing}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setField("address", e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, address: true }))}
        invalid={editing && !!touched.address && !validators.address(value.address)}
        hint="At least 6 characters"
        onClear={() => setField("address", "")}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="customer-map-url" className="ui-label">
            Google Map URL / iframe / coordinates (optional)
          </label>

          <div className="flex min-w-0 items-stretch gap-2">
            <input
              id="customer-map-url"
              className={
                uiFieldClass(editing && !!touched.mapUrl && !validators.mapUrlOptional(value.mapUrl), editing) +
                " min-w-0 flex-1"
              }
              placeholder={'Paste link, iframe, "lat,lng" or DMS like 14°25\'32.5"N 79°57\'21.1"E'}
              value={value.mapUrl}
              disabled={!editing}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("mapUrl", e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, mapUrl: true }))}
              aria-invalid={editing && touched.mapUrl && !validators.mapUrlOptional(value.mapUrl)}
              aria-describedby={editing && touched.mapUrl && !validators.mapUrlOptional(value.mapUrl) ? "customer-map-error" : undefined}
            />

            <div className="flex items-center gap-1">
              {editing && value.mapUrl?.trim() ? (
                <button
                  type="button"
                  title="Clear map"
                  aria-label="Clear map"
                  onClick={clearMapUrl}
                  className="ui-icon-btn"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}

              <button
                type="button"
                title="Use my current location"
                aria-label="Use my location"
                onClick={handleUseMyLocation}
                disabled={!editing}
                className="ui-icon-btn"
              >
                <LocateFixed className="h-4 w-4" />
              </button>

              <button
                type="button"
                title="Sync parsed location into Address"
                aria-label="Sync location"
                onClick={handleSyncAddress}
                disabled={!editing || (!lastGuess && !mapEmbed)}
                className="ui-icon-btn"
              >
                <RefreshCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {editing && isShortMap && (
            <p className="ui-error">
              Short link detected. Static deploys cannot expand short links. Open it once and paste the
              full Google Maps URL or the &quot;Embed map&quot; iframe.
            </p>
          )}

          {editing && !!touched.mapUrl && !validators.mapUrlOptional(value.mapUrl) && (
            <p id="customer-map-error" className="ui-error">
              Must be a Google Maps URL/iframe, a decimal pair like <code>18.440093, 79.106421</code>, or a
              DMS pair like <code>18°26&apos;24.3&quot;N 79°06&apos;23.1&quot;E</code>.
            </p>
          )}

          {lastGuess && (
            <p className="ui-help">
              Parsed location: <span className="font-medium">{lastGuess}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col justify-end">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs" style={{ color: "var(--color-muted)" }}>
            <input
              type="checkbox"
              className="h-4 w-4 accent-blue-600"
              checked={autoFillAddress}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAutoFillAddress(e.target.checked)}
            />
            Auto-fill Address from Map input {PUBLIC_MAPS_KEY ? "(via Geocoding API)" : "(no geocoding uses coords)"}
          </label>
        </div>
      </div>

      {mapEmbed && (
        <div>
          <p className="ui-help">Map preview</p>
          <iframe
            src={mapEmbed}
            className="h-[280px] w-full rounded-xl border bg-[color:var(--color-card)] sm:h-[320px]"
            style={{ borderColor: "var(--color-border)" }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            title="Map preview"
          />
        </div>
      )}

      {onSubmit && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="ui-btn ui-btn-primary w-full sm:w-auto"
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

