"use client";

import { RefObject } from "react";

type Props = {
  pdfUrl: string | null;
  showPreview: boolean;
  previewRef: RefObject<HTMLDivElement | null>;
};

export default function PdfPreview({ pdfUrl, showPreview, previewRef }: Props) {
  if (!pdfUrl || !showPreview) return null;

  return (
    <div ref={previewRef} id="pdf-preview" className="mt-4">
      <h4 className="mb-2 font-medium">PDF Preview</h4>
      <iframe
        src={pdfUrl}
        title="PDF preview"
        className="h-[56vh] w-full rounded-xl border bg-[color:var(--color-bg)] sm:h-[70vh]"
        style={{ borderColor: "var(--color-border)" }}
      />
    </div>
  );
}
