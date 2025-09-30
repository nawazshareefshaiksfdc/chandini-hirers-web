"use client";

import React from "react";

type Props = {
  show?: boolean;            // control externally; if omitted, always show
  message?: string;          // optional message under the spinner
  spinnerSize?: number;      // px
  dimClassName?: string;     // override backdrop styles if needed
};

export default function FullScreenLoader({
  show = true,
  message,
  spinnerSize = 48,
  dimClassName = "bg-white",
}: Props) {
  if (!show) return null;
  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center ${dimClassName}`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      role="status"
      aria-live="polite"
      aria-label={message ?? "Loading…"}
    >
      <div
        className="animate-spin rounded-full border-4 border-gray-200"
        style={{
          width: spinnerSize,
          height: spinnerSize,
          borderTopColor: "var(--color-primary, #2563EB)",
        }}
      />
      {message ? (
        <div className="mt-3 text-sm text-gray-600" aria-hidden="true">
          {message}
        </div>
      ) : null}
      <span className="sr-only">{message ?? "Loading"}</span>
    </div>
  );
}
