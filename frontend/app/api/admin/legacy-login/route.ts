import { NextResponse } from "next/server";

const backendBase = () => (process.env.BACKEND_ORIGIN || "").replace(/\/$/, "");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Same-origin proxy for admin login — avoids browser CORS to Render and keeps secrets off the client. */
export async function POST(request: Request) {
  const base = backendBase();
  if (!base) {
    return NextResponse.json(
      { success: false, error: "BACKEND_ORIGIN is not set on Vercel.", data: null },
      { status: 500 }
    );
  }
  const body = await request.text();
  const target = `${base}/api/v1/auth/legacy-admin`;
  try {
    const res = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[legacy-login proxy]", target, msg);
    return NextResponse.json(
      {
        success: false,
        error: `Cannot reach API (${msg}). Check BACKEND_ORIGIN and that Render is awake (open /api/v1/health once).`,
        data: null,
      },
      { status: 502 }
    );
  }
}
