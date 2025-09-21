// src/components/CatalogBootstrap.tsx
"use client";
import { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { kCatalog } from "@/data/catalog";

export default function CatalogBootstrap() {
  const cart = useCart();
  useEffect(() => {
    cart.syncCatalog(kCatalog);
  }, []);
  return null;
}
