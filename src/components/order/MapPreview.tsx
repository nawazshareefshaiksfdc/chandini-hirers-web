"use client";

type Props = { embedSrc: string | null };

export default function MapPreview({ embedSrc }: Props) {
  if (!embedSrc) return null;
  return (
    <div className="mt-2">
      <iframe
        src={embedSrc}
        className="w-full h-[300px] rounded-lg border border-gray-800 bg-[#0c1323]"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
