"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  onAdd: () => void;
  onRemove: () => void;
  onSet: (n: number) => void;
  onClear?: () => void;
};

export default function QtyStepper({ value, onAdd, onRemove, onSet, onClear }: Props) {
  const [text, setText] = useState(String(value));
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setText(String(value)), [value]);

  const clamp = (raw: string) => {
    const n = parseInt((raw ?? "").replace(/[^\d]/g, ""), 10);
    return isNaN(n) || n < 0 ? 0 : n;
  };

  const apply = (raw: string) => {
    const q = clamp(raw);
    setText(String(q));
    onSet(q);
    if (q === 0 && onClear) onClear();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onAdd();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (value > 0) onRemove();
    } else if (e.key === "Enter") {
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    // Only adjust when focused to avoid accidental changes while scrolling the page
    if (document.activeElement !== e.currentTarget) return;
    e.preventDefault();
    if (e.deltaY < 0) onAdd();
    else if (e.deltaY > 0 && value > 0) onRemove();
  };

  const disableMinus = value <= 0;

  return (
    <div className="flex items-center justify-center gap-1 text-xs sm:gap-1.5 sm:text-base">
      {/* – Button */}
      <button
        type="button"
        aria-label="Decrease"
        disabled={disableMinus}
        onClick={onRemove}
        className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-md text-base sm:text-lg font-bold transition cursor-pointer border
        ${disableMinus
            ? "bg-[#1a1a2e] border-gray-700 text-gray-500"
            : "bg-[color:var(--color-card)] border-gray-600 text-[color:var(--color-ink)] hover:bg-[color:var(--color-primary)] hover:text-white"
          }`}
      >
        −
      </button>

      {/* Input */}
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => apply(e.target.value)}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        onFocus={(e) => e.currentTarget.select()}
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label="Quantity"
        className="w-9 h-8 sm:w-10 sm:h-9 text-center rounded-md bg-[color:var(--color-card)] border border-gray-600 text-[color:var(--color-ink)] font-semibold focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
      />

      {/* + Button */}
      <button
        type="button"
        aria-label="Increase"
        onClick={onAdd}
        className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-md bg-[color:var(--color-primary)] hover:brightness-110 text-white font-bold text-base sm:text-lg transition cursor-pointer"
      >
        +
      </button>
    </div>
  );
}
