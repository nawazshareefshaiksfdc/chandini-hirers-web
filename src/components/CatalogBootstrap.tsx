"use client";

import { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { kCatalog } from "@/data/catalog";

/** Runs once after mount to ensure itemsById is populated for all routes */
export default function CatalogBootstrap() {
  const cart = useCart();
  useEffect(() => {
    cart.syncCatalog(kCatalog);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
