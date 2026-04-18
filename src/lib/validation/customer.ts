import type { CustomerForm } from "@/types/order";
/** parse <input type="datetime-local"> value into local Date */
function parseLocal(dt: string): Date | null {
  if (!dt || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dt)) return null;
  const [d, t] = dt.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [hh, mm] = t.split(":").map(Number);
  return new Date(y, m - 1, day, hh, mm, 0, 0);
}
const name = (v: string) => typeof v === "string" && v.trim().length >= 2;
const phone = (v: string) => /^\d{10,15}$/.test(v || "");
const eventType = (v: string) => typeof v === "string" && v.trim().length > 0;
const address = (v: string) => typeof v === "string" && v.trim().length >= 6;
const mapUrlOptional = (v: string) => {
  void v;
  return true;
};
/**
 * ✅ allow past or future
 * only require a valid datetime value
 */
const startDateTime = (v: string) => {
  return parseLocal(v) !== null;
};
const endDateTime = (v: string, startV?: string) => {
  const e = parseLocal(v);
  const s = parseLocal(startV || "");
  if (!e || !s) return false;
  return e.getTime() > s.getTime();
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
  if (!startDateTime(f.startDateTime))
    errors.startDateTime = "Choose a valid start date & time.";
  if (!endDateTime(f.endDateTime, f.startDateTime))
    errors.endDateTime = "End must be after Start.";
  if (!address(f.address)) errors.address = "At least 6 characters.";
  const valid = Object.keys(errors).length === 0;
  return { valid, errors };
}
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
export const emptyCustomerForm: CustomerForm = {
  name: "",
  phone: "",
  eventType: "",
  startDateTime: "",
  endDateTime: "",
  address: "",
  mapUrl: "",
};