import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function TopNav() {
  return (
    <header className="border-b" style={{ borderColor: "var(--color-border)" }}>
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-base font-semibold tracking-tight sm:text-lg" style={{ color: "var(--color-text)" }}>
          Chandini Hirers
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}

