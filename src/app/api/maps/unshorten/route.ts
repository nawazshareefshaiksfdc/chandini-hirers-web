import { NextRequest } from "next/server";
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u");
  if (!u) {
    return new Response(JSON.stringify({ error: "Missing u" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Try normal follow first
    let r = await fetch(u, { redirect: "follow" });
    // If it ended OK, response.url should be the final expanded URL
    let finalUrl = r.url;

    // Some shorteners respond with 3xx and Location but Node followed already.
    // If we still have a goo.gl host for any reason, try manual mode:
    if (new URL(finalUrl).hostname === "maps.app.goo.gl") {
      r = await fetch(u, { redirect: "manual" as RequestRedirect });
      const loc = r.headers.get("location");
      if (loc) finalUrl = new URL(loc, u).toString();
    }

    return new Response(JSON.stringify({ finalUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Unshorten failed" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}
