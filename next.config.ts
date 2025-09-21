// next.config.ts
import type { NextConfig } from "next";

const base = process.env.NEXT_PUBLIC_BASE_PATH || ""; // e.g. "/chandini-hirers-web"

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // These make all static assets resolve under your repo path
  basePath: base || undefined,
  assetPrefix: base || undefined,
};

export default nextConfig;
