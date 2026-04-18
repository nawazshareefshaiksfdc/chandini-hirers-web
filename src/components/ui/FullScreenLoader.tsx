"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  show: boolean;
  /** Let clicks pass through the overlay (keep page usable) */
  block?: boolean;
  /** Overlay darkness: 0 = transparent, 1 = black */
  dim?: number;
};

export default function FullScreenLoader({
  show,
  block = false,
  dim = 0.25,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!show || !mounted) return null;

  const overlay = (
    <div
      className={[
        "fixed inset-0 z-[99999] flex items-center justify-center", // very top, centered
        block ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      style={{ backgroundColor: `rgba(0,0,0,${dim})` }}
      aria-hidden="true"
    >
      <div className="pointer-events-none">
        <div className="flex items-end gap-[6px]">
          {[
            "var(--color-primary)",
            "var(--color-muted)",
            "var(--color-primary)",
            "var(--color-muted)",
            "var(--color-primary)",
          ].map((c, i) => (
            <span
              key={i}
              className="w-[4px] h-[50px] animate-barscale origin-bottom rounded-[2px]"
              style={{
                backgroundColor: c,
                animationDelay: i === 0 ? "0s" : `${-0.9 + 0.1 * (i - 1)}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
