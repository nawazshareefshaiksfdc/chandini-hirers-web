import type { CustomerForm } from "@/types/order";

/** small helper to parse <input type="datetime-local"> value into Date (local) */
function parseLocal(dt: string): Date | null {
  if (!dt || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dt)) return null;
  const [d, t] = dt.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [hh, mm] = t.split(":").map(Number);
  // Date(year, monthIndex, day, hours, minutes) in local tz
  return new Date(y, m - 1, day, hh, mm, 0, 0);
}

/** NEW: round a Date down to the minute (zero seconds/ms) to compare cleanly */
function roundToMinute(d: Date) {
  d.setSeconds(0, 0);
  return d;
}

const name = (v: string) => typeof v === "string" && v.trim().length >= 2;
const phone = (v: string) => /^\d{10,15}$/.test(v || "");
const eventType = (v: string) => typeof v === "string" && v.trim().length > 0;
const address = (v: string) => typeof v === "string" && v.trim().length >= 6;
const mapUrlOptional = (v: string) => {
  void v;
  return true;
};
/** UPDATED: time validators — allow "now" (current minute) as valid, disallow only past */
const startDateTime = (v: string) => {
  const d = parseLocal(v);
  if (!d) return false;
  const now = roundToMinute(new Date());
  return roundToMinute(new Date(d)).getTime() >= now.getTime(); // allow now
};

const endDateTime = (v: string, startV?: string) => {
  const e = parseLocal(v);
  const s = parseLocal(startV || "");
  if (!e || !s) return false;
  const nowMs = roundToMinute(new Date()).getTime();
  const eMs = roundToMinute(new Date(e)).getTime();
  const sMs = roundToMinute(new Date(s)).getTime();
  return eMs >= sMs && eMs >= nowMs; // allow equality with start and with now
};

export const validators = {
  name,
  phone,
  eventType,
  startDateTime,
  endDateTime,
  address,
  mapUrlOptional,
};

export function validateCustomer(f: CustomerForm) {
  const errors: Partial<Record<keyof CustomerForm, string>> = {};

  if (!name(f.name)) errors.name = "Enter at least 2 characters.";
  if (!phone(f.phone)) errors.phone = "Phone must be 10–15 digits (with country code).";
  if (!eventType(f.eventType)) errors.eventType = "Please select an event.";
  if (!startDateTime(f.startDateTime)) errors.startDateTime = "Choose a start date & time that is now or in the future.";
  if (!endDateTime(f.endDateTime, f.startDateTime))
    errors.endDateTime = "End must be at or after Start and not in the past.";
  if (!address(f.address)) errors.address = "At least 6 characters.";

  const valid = Object.keys(errors).length === 0;
  return { valid, errors };
}

/** optional: coerce */
export function coerceCustomerForm(raw: unknown): CustomerForm {
  const r = (raw ?? {}) as Partial<Record<keyof CustomerForm, unknown>>;
  const s = (x: unknown) => (x == null ? "" : String(x));
  return {
    name: s(r.name),
    phone: s(r.phone),
    eventType: s(r.eventType),
    startDateTime: s(r.startDateTime),
    endDateTime: s(r.endDateTime),
    address: s(r.address),
    mapUrl: s(r.mapUrl),
  };
}

/** empty */
export const emptyCustomerForm: CustomerForm = {
  name: "",
  phone: "",
  eventType: "",
  startDateTime: "",
  endDateTime: "",
  address: "",
  mapUrl: "",
};
