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
      <h4 className="text-white font-medium mb-2">PDF Preview</h4>
      <iframe src={pdfUrl} className="w-full h-[70vh] rounded-lg border border-gray-800 bg-[#0c1323]" />
    </div>
  );
}
