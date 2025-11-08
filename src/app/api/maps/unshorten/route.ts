// src/app/api/maps/unshorten/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const u = searchParams.get('u')?.trim();
    if (!u) {
      return NextResponse.json({ error: 'u required' }, { status: 400 });
    }

    // Follow redirects but don’t cache
    const res = await fetch(u, { redirect: 'follow', cache: 'no-store' });
    // Prefer the final URL the fetch ended at (Node’s fetch exposes .url)
    const finalUrl = res.url || u;

    return NextResponse.json({ finalUrl }, { status: 200 });
  } catch {
    // Don’t break build
    return NextResponse.json({ finalUrl: null }, { status: 200 });
  }
}
