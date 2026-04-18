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
      className="inline-flex items-center justify-center rounded-full border shadow-sm transition-all duration-200 hover:-translate-y-0.5"
      style={{ width: "44px", height: "44px", backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      <Image src={imgSrc} alt={alt} width={22} height={22} className="pointer-events-none select-none" />
      <span className="sr-only">{label}</span>
    </Link>
  );
}

