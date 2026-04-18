"use client";

type Props = { embedSrc: string | null };

export default function MapPreview({ embedSrc }: Props) {
  if (!embedSrc) return null;
  return (
    <div className="mt-2">
      <iframe
        src={embedSrc}
        title="Map preview"
        className="h-[280px] w-full rounded-xl border bg-[color:var(--color-bg)] sm:h-[320px]"
        style={{ borderColor: "var(--color-border)" }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
