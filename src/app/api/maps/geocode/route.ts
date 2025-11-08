import { NextRequest } from "next/server";

const isLatLng = (s: string) => /^\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/.test(s);

export async function GET(req: NextRequest) {
  const location = req.nextUrl.searchParams.get("location");
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing GOOGLE_API_KEY" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
  if (!location) {
    return new Response(JSON.stringify({ error: "Missing location" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  // If it's "lat,lng" -> use reverse geocode (latlng=)
  const endpoint = isLatLng(location.trim())
    ? `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(location)}&key=${apiKey}`
    : `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`;

  try {
    const r = await fetch(endpoint);
    const data = await r.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Geocoding failed" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}
