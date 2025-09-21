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
    const s = String(q);
    setText(s);
    onSet(q);
  };

  const disableMinus = value <= 0;

  return (
    <div className="flex items-center" suppressHydrationWarning>
      <button className="py-1 px-2 rounded-md border" onClick={onRemove} disabled={disableMinus} aria-label="Decrease" type="button">
        -
      </button>

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
        data-1p-ignore
        data-form-type="other"
        className="w-14 text-center border rounded-md py-1 mx-2"
        suppressHydrationWarning
      />

      <button className="py-1 px-2 rounded-md border" onClick={onAdd} aria-label="Increase" type="button">
        +
      </button>
    </div>
  );
}
