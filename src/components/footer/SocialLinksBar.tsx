"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export type SocialLink = {
  href: string;       // Destination URL
  label: string;      // Accessible label / title
  imgSrc: string;     // e.g. "/social/instagram.png"
  size?: number;      // icon size in px (default 22)
};

type Props = {
  links: SocialLink[];
  onReady?: () => void; // optional callback when all images are preloaded
};

/**
 * SocialLinksBar
 * - Preloads all icon images before showing them (skeleton while loading)
 * - 44×44px touch targets (mobile-friendly)
 * - Accessible labels and focus ring
 */
export default function SocialLinksBar({ links, onReady }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function preload() {
      try {
        await Promise.all(
          links.map(
            (l) =>
              new Promise<void>((resolve, reject) => {
                const img = new window.Image();
                img.src = l.imgSrc;
                img.onload = () => resolve();
                img.onerror = (e) => reject(e);
              })
          )
        );
      } catch {
        // Even if one fails, don't block UI forever
      } finally {
        if (!cancelled) {
          setReady(true);
          onReady?.();
        }
      }
    }

    preload();
    return () => {
      cancelled = true;
    };
  }, [links, onReady]);

  if (!ready) {
    // Skeleton placeholders (same count as links)
    return (
      <div className="flex items-center justify-center gap-3 sm:gap-4 pb-2">
        {links.map((_, idx) => (
          <div
            key={idx}
            className="rounded-full bg-gray-200 animate-pulse"
            style={{ width: 44, height: 44 }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4 pb-2">
      {links.map((l) => {
        const size = l.size ?? 22;
        return (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={l.label}
            title={l.label}
            className="inline-flex items-center justify-center rounded-full border shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] transition"
            style={{ width: 44, height: 44 }}
          >
            <Image
              src={l.imgSrc}
              width={size}
              height={size}
              alt={l.label}
              priority
              className="pointer-events-none select-none"
            />
            <span className="sr-only">{l.label}</span>
          </a>
        );
      })}
    </div>
  );
}
