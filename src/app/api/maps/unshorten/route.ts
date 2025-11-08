import { NextResponse } from "next/server";

// Serverful, dynamic, no caching
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const u = searchParams.get("u")?.trim();
    if (!u) {
      return NextResponse.json({ error: "u required" }, { status: 400 });
    }

    // Follow redirects but don’t cache
    const res = await fetch(u, { redirect: "follow", cache: "no-store" });
    const finalUrl = res.url || u;

    return NextResponse.json({ finalUrl }, { status: 200 });
  } catch {
    return NextResponse.json({ finalUrl: null }, { status: 200 });
  }
}
