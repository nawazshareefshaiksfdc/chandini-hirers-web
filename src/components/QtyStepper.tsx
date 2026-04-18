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
    return Number.isNaN(n) || n < 0 ? 0 : n;
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
    if (document.activeElement !== e.currentTarget) return;
    e.preventDefault();
    if (e.deltaY < 0) onAdd();
    else if (e.deltaY > 0 && value > 0) onRemove();
  };

  const disableMinus = value <= 0;

  return (
    <div className="flex items-center justify-center gap-1 text-xs sm:gap-1.5 sm:text-base">
      <button
        type="button"
        aria-label="Decrease"
        disabled={disableMinus}
        onClick={onRemove}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-base font-bold transition-all duration-200 sm:h-9 sm:w-9 sm:text-lg"
        style={{
          backgroundColor: disableMinus ? "var(--color-bg)" : "var(--color-card)",
          borderColor: "var(--color-border)",
          color: disableMinus ? "var(--color-muted)" : "var(--color-text)",
        }}
      >
        -
      </button>

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
        className="ui-input h-8 w-10 px-1 py-1 text-center font-semibold sm:h-9"
      />

      <button
        type="button"
        aria-label="Increase"
        onClick={onAdd}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-[color:var(--color-primary)] text-base font-bold text-white transition-all duration-200 hover:brightness-110 sm:h-9 sm:w-9 sm:text-lg"
      >
        +
      </button>
    </div>
  );
}

