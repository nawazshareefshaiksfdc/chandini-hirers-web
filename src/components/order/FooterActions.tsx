"use client";

import { Eye, EyeOff } from "lucide-react";

type Props = {
  disabled: boolean;
  showPreview: boolean;
  onTogglePreview: () => void;
  onOrderNow: () => void;
  titleWhenInvalid: string;
};

export default function FooterActions({
  disabled,
  showPreview,
  onTogglePreview,
  onOrderNow,
  titleWhenInvalid,
}: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 bg-[color:var(--color-card)] border-t border-gray-700">
      <div className="max-w-5xl mx-auto px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          className="inline-flex items-center justify-center gap-2 border border-gray-700 rounded-xl py-3 text-gray-300 hover:border-[color:var(--color-primary)] hover:text-white transition disabled:opacity-40"
          onClick={onTogglePreview}
          disabled={disabled}
          title={titleWhenInvalid}
        >
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showPreview ? "Hide Preview" : "Preview PDF"}
        </button>

        <button
          className="bg-[color:var(--color-primary)] text-white rounded-xl py-3 hover:saturate-125 transition disabled:opacity-40"
          onClick={onOrderNow}
          disabled={disabled}
          title="Order Now"
        >
          Order Now
        </button>
      </div>
    </div>
  );
}
