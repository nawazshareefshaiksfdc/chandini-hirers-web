"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  onAdd: () => void;
  onRemove: () => void;
  onSet: (n: number) => void;
  onClear?: () => void;
};

export default function QtyStepper({ value, onAdd, onRemove, onSet }: Props) {
  const [text, setText] = useState(String(value));
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setText(String(value)), [value]);

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
    <div className="flex items-center justify-center gap-1.5 text-sm sm:text-base">
      {/* – Button */}
      <button
        type="button"
        aria-label="Decrease"
        disabled={disableMinus}
        onClick={onRemove}
        className={`w-9 h-9 flex items-center justify-center rounded-md text-lg font-bold transition cursor-pointer ${
          disableMinus
            ? "bg-[#1a1a2e] border border-gray-700 text-gray-500"
            : "bg-[color:var(--color-card)] border border-gray-600 text-white hover:bg-[color:var(--color-primary)] hover:text-white"
        }`}
      >
        −
      </button>

      {/* Input */}
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => apply(e.target.value)}
        onBlur={(e) => apply(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        inputMode="numeric"
        pattern="[0-9]*"
        className="w-10 h-9 text-center rounded-md bg-[color:var(--color-card)] border border-gray-600 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
      />

      {/* + Button */}
      <button
        type="button"
        aria-label="Increase"
        onClick={onAdd}
        className="w-9 h-9 flex items-center justify-center rounded-md bg-[color:var(--color-primary)] hover:brightness-110 text-white font-bold text-lg transition cursor-pointer"
      >
        +
      </button>
    </div>
  );
}
