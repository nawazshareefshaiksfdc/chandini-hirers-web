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

  useEffect(() => {
    setText(String(value));
  }, [value]);

  const clamp = (raw: string) => {
    const n = parseInt(raw.replace(/\D+/g, ""), 10);
    return isNaN(n) || n < 0 ? 0 : n;
  };

  const apply = (raw: string) => {
    const q = clamp(raw);
    setText(String(q));
    onSet(q);
  };

  const disableMinus = value <= 0;

  return (
    <div className="flex items-center justify-center gap-2 w-full max-w-full text-sm sm:text-base">
      {/* - Button */}
      <button
        type="button"
        aria-label="Decrease"
        disabled={disableMinus}
        onClick={onRemove}
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center text-lg disabled:opacity-30"
      >
        −
      </button>

      {/* Qty Box */}
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => apply(e.target.value)}
        onBlur={(e) => apply(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        name="qty"
        className="w-14 h-9 sm:h-10 text-center border rounded-md"
        suppressHydrationWarning
      />

      {/* + Button */}
      <button
        type="button"
        aria-label="Increase"
        onClick={onAdd}
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center text-lg"
      >
        +
      </button>
    </div>
  );
}
