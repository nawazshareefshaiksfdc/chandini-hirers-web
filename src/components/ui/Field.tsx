"use client";

import React, { useId } from "react";
import { X } from "lucide-react";

export const uiFieldClass = (invalid: boolean, enabled = true) => {
  const state = invalid ? "ui-input ui-input-invalid" : "ui-input";
  const lock = enabled ? "" : " opacity-60 cursor-not-allowed";
  return `${state}${lock}`;
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

function FieldHint({ invalid, hint, id }: { invalid?: boolean; hint?: string; id: string }) {
  if (!hint) return null;
  return (
    <p id={id} className={invalid ? "ui-error" : "ui-help"}>
      {hint}
    </p>
  );
}

export function InputField(props: React.InputHTMLAttributes<HTMLInputElement> & WithClear) {
  const { invalid, label, hint, className, onClear, disabled, value, id, ...rest } = props;
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = `${fieldId}-hint`;
  const showClear = !!onClear && !disabled && hasNonEmptyValue(value);

  return (
    <div className="flex min-w-0 flex-col gap-1">
      {label && (
        <label htmlFor={fieldId} className="ui-label">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={fieldId}
          className={[uiFieldClass(!!invalid, !disabled), showClear ? "pr-10" : "", className ?? ""]
            .join(" ")
            .trim()}
          disabled={disabled}
          value={value}
          aria-invalid={invalid || undefined}
          aria-describedby={hint ? hintId : undefined}
          {...rest}
        />

        {showClear && (
          <button
            type="button"
            className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg transition-all duration-200 hover:bg-[color:var(--color-primary-weak)]"
            onClick={onClear}
            aria-label="Clear"
            title="Clear"
          >
            <X className="h-4 w-4" style={{ color: "var(--color-muted)" }} />
          </button>
        )}
      </div>

      <FieldHint invalid={invalid} hint={hint} id={hintId} />
    </div>
  );
}

export function TextareaField(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & WithClear) {
  const { invalid, label, hint, className, rows = 3, onClear, disabled, value, id, ...rest } = props;
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = `${fieldId}-hint`;
  const showClear = !!onClear && !disabled && hasNonEmptyValue(value);

  return (
    <div className="flex min-w-0 flex-col gap-1">
      {label && (
        <label htmlFor={fieldId} className="ui-label">
          {label}
        </label>
      )}

      <div className="relative">
        <textarea
          id={fieldId}
          rows={rows}
          className={[uiFieldClass(!!invalid, !disabled), showClear ? "pr-10" : "", className ?? ""]
            .join(" ")
            .trim()}
          disabled={disabled}
          value={value}
          aria-invalid={invalid || undefined}
          aria-describedby={hint ? hintId : undefined}
          {...rest}
        />

        {showClear && (
          <button
            type="button"
            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 hover:bg-[color:var(--color-primary-weak)]"
            onClick={onClear}
            aria-label="Clear"
            title="Clear"
          >
            <X className="h-4 w-4" style={{ color: "var(--color-muted)" }} />
          </button>
        )}
      </div>

      <FieldHint invalid={invalid} hint={hint} id={hintId} />
    </div>
  );
}

export function SelectField(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & WithClear & { children: React.ReactNode }
) {
  const { invalid, label, hint, className, disabled, children, onClear, value, id, ...rest } = props;
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = `${fieldId}-hint`;
  const showClear = !!onClear && !disabled && hasNonEmptyValue(value);

  return (
    <div className="flex min-w-0 flex-col gap-1">
      {label && (
        <label htmlFor={fieldId} className="ui-label">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={fieldId}
          className={[uiFieldClass(!!invalid, !disabled), showClear ? "pr-10" : "", className ?? ""]
            .join(" ")
            .trim()}
          disabled={disabled}
          value={value}
          aria-invalid={invalid || undefined}
          aria-describedby={hint ? hintId : undefined}
          {...rest}
        >
          {children}
        </select>

        {showClear && (
          <button
            type="button"
            className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg transition-all duration-200 hover:bg-[color:var(--color-primary-weak)]"
            onClick={onClear}
            aria-label="Clear"
            title="Clear"
          >
            <X className="h-4 w-4" style={{ color: "var(--color-muted)" }} />
          </button>
        )}
      </div>

      <FieldHint invalid={invalid} hint={hint} id={hintId} />
    </div>
  );
}

