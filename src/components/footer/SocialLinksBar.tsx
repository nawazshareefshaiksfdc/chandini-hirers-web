"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export type SocialLink = {
  href: string;
  label: string;
  imgSrc: string;
  size?: number;
};

type Props = {
  links: SocialLink[];
  onReady?: () => void;
};

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
    return (
      <div className="flex items-center justify-center gap-3 pb-2 sm:gap-4">
        {links.map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse rounded-full"
            style={{ width: 44, height: 44, backgroundColor: "var(--color-border)" }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 pb-2 sm:gap-4">
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
            className="inline-flex items-center justify-center rounded-full border shadow-sm transition-all duration-200 hover:-translate-y-0.5"
            style={{ width: 44, height: 44, backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
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
