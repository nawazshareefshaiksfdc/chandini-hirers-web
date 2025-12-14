"use client";

import React from "react";
import { X } from "lucide-react";

export const uiFieldClass = (invalid: boolean, enabled = true) => {
  const base =
    "w-full px-3 py-2 rounded-md bg-[#0c1323] border text-sm outline-none focus:ring-1";
  const state = invalid
    ? "border-amber-400 text-amber-100 placeholder-amber-200 focus:ring-amber-400 bg-amber-500/5"
    : "border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-[color:var(--color-primary)]";
  const lock = enabled ? "" : " opacity-60 cursor-not-allowed";
  return base + " " + state + lock;
};

type WithClear = {
  invalid?: boolean;
  label?: string;
  hint?: string;
  onClear?: () => void;
};

function hasNonEmptyValue(v: unknown) {
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.join(",").trim().length > 0;
  return String(v).trim().length > 0;
}

export function InputField(
  props: React.InputHTMLAttributes<HTMLInputElement> & WithClear
) {
  const { invalid, label, hint, className, onClear, disabled, value, ...rest } =
    props;

  const showClear = !!onClear && !disabled && hasNonEmptyValue(value);

  return (
    <div className="flex flex-col">
      {label && <label className="text-xs text-gray-400 mb-1">{label}</label>}

      <div className="relative">
        <input
          className={
            uiFieldClass(!!invalid, !disabled) +
            (showClear ? " pr-10" : "") +
            (className ? " " + className : "")
          }
          disabled={disabled}
          value={value}
          {...rest}
        />

        {/* ✅ Only show clear button when input has value */}
        {showClear && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#1b2340]"
            onClick={onClear}
            aria-label="Clear"
            title="Clear"
          >
            <X className="w-4 h-4 text-gray-300" />
          </button>
        )}
      </div>

      {invalid && hint && <p className="mt-1 text-[11px] text-amber-300">{hint}</p>}
    </div>
  );
}

export function TextareaField(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & WithClear
) {
  const {
    invalid,
    label,
    hint,
    className,
    rows = 3,
    onClear,
    disabled,
    value,
    ...rest
  } = props;

  const showClear = !!onClear && !disabled && hasNonEmptyValue(value);

  return (
    <div className="flex flex-col">
      {label && <label className="text-xs text-gray-400 mb-1">{label}</label>}

      <div className="relative">
        <textarea
          rows={rows}
          className={
            uiFieldClass(!!invalid, !disabled) +
            (showClear ? " pr-10" : "") +
            (className ? " " + className : "")
          }
          disabled={disabled}
          value={value}
          {...rest}
        />

        {/* ✅ Only show clear button when textarea has value */}
        {showClear && (
          <button
            type="button"
            className="absolute right-2 top-2 p-1 rounded hover:bg-[#1b2340]"
            onClick={onClear}
            aria-label="Clear"
            title="Clear"
          >
            <X className="w-4 h-4 text-gray-300" />
          </button>
        )}
      </div>

      {invalid && hint && <p className="mt-1 text-[11px] text-amber-300">{hint}</p>}
    </div>
  );
}

export function SelectField(
  props: React.SelectHTMLAttributes<HTMLSelectElement> &
    WithClear & { children: React.ReactNode }
) {
  const { invalid, label, hint, className, disabled, children, onClear, value, ...rest } =
    props;

  const showClear = !!onClear && !disabled && hasNonEmptyValue(value);

  return (
    <div className="flex flex-col">
      {label && <label className="text-xs text-gray-400 mb-1">{label}</label>}

      <div className="relative">
        <select
          className={
            uiFieldClass(!!invalid, !disabled) +
            (showClear ? " pr-10" : "") +
            (className ? " " + className : "")
          }
          disabled={disabled}
          value={value}
          {...rest}
        >
          {children}
        </select>

        {/* ✅ Optional: clear for select if you pass onClear */}
        {showClear && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[#1b2340]"
            onClick={onClear}
            aria-label="Clear"
            title="Clear"
          >
            <X className="w-4 h-4 text-gray-300" />
          </button>
        )}
      </div>

      {invalid && hint && <p className="mt-1 text-[11px] text-amber-300">{hint}</p>}
    </div>
  );
}
