"use client";

import Image from "next/image";
import Link from "next/link";

interface SocialIconProps {
  href: string;
  imgSrc: string;
  alt: string;
  label: string;
}

export default function SocialIcon({ href, imgSrc, alt, label }: SocialIconProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center rounded-full border shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] transition"
      style={{ width: "44px", height: "44px" }}
    >
      <Image
        src={imgSrc}
        alt={alt}
        width={22}
        height={22}
        className="pointer-events-none select-none"
      />
      <span className="sr-only">{label}</span>
    </Link>
  );
}
