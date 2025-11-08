// Make this a serverful, dynamic, non-cached route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location')?.trim();

    if (!location) {
      return NextResponse.json({ error: 'location required', results: [] }, { status: 400 });
    }

    // Read key safely; do NOT crash the build if absent
    const apiKey =
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_MAPS_KEY;

    if (!apiKey) {
      // Return an empty result instead of throwing so "collecting page data" doesn't fail
      return NextResponse.json(
        { results: [], note: 'no Google Maps API key configured' },
        { status: 200 },
      );
    }

    const url =
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`;

    const r = await fetch(url, { cache: 'no-store' });
    const data = await r.json();

    return NextResponse.json(data, { status: 200 });
  } catch {
    // Never throw during build/collection; respond gracefully
    return NextResponse.json({ results: [], note: 'geocode failed' }, { status: 200 });
  }
}
