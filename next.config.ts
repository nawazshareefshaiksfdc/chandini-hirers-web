// next.config.ts
import type { NextConfig } from "next";

const base = process.env.NEXT_PUBLIC_BASE_PATH || ""; // e.g. "/chandini-hirers-web"

const nextConfig: NextConfig = {
  images: { unoptimized: true },         
  basePath: base || undefined,          
};

export default nextConfig;
