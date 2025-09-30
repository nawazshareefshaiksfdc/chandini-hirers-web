import type { Metadata } from "next";
import "./global.css";
import { CartProvider } from "@/context/CartContext";
import CatalogBootstrap from "@/components/CatalogBootstrap"; // 👈

export const metadata: Metadata = {
  title: "Chandini Hirers",
  description: "Static catalog with cart, PDF, share",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh text-[color:var(--color-ink)]">
        <CartProvider>
          <CatalogBootstrap /> {/* 👈 ensures catalog is loaded after any refresh/deep-link */}
          <div className="max-w-6xl mx-auto px-4">
            <div className="h-2 bg-[color:var(--color-primary)] rounded-b-2xl mb-4" />
            {children}
            <div className="h-8" />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
