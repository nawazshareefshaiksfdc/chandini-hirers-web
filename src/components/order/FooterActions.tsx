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
    <div className="fixed inset-x-0 bottom-0 border-t bg-[color:var(--color-card)]" style={{ borderColor: "var(--color-border)" }}>
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-2 sm:px-6 lg:px-8">
        <button className="ui-btn w-full" onClick={onTogglePreview} disabled={disabled} title={titleWhenInvalid}>
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPreview ? "Hide Preview" : "Preview PDF"}
        </button>

        <button className="ui-btn ui-btn-primary w-full" onClick={onOrderNow} disabled={disabled} title="Order Now">
          Order Now
        </button>
      </div>
    </div>
  );
}
