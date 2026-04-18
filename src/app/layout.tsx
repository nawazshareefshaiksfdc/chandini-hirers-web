import type { Metadata } from "next";
import Script from "next/script";
import "./global.css";
import CatalogBootstrap from "@/components/CatalogBootstrap";
import TopNav from "@/components/TopNav";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "Chandini Hirers",
  description: "Static catalog with cart, PDF, share",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (() => {
              try {
                const stored = localStorage.getItem("chandini.theme");
                const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                const isDark = stored === "dark" || ((stored === null || stored === "system") && prefersDark);
                document.documentElement.classList.toggle("dark", isDark);
                document.documentElement.style.colorScheme = isDark ? "dark" : "light";
              } catch {}
            })();
          `}
        </Script>

        <ThemeProvider>
          <CartProvider>
            <CatalogBootstrap />
            <TopNav />
            <div className="mx-auto w-full max-w-[1200px] px-4 pb-8 pt-4 sm:px-6 lg:px-8">{children}</div>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

