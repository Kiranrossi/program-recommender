import { NextRequest, NextResponse } from "next/server";

const backendBase = () => (process.env.BACKEND_ORIGIN || "http://127.0.0.1:8000").replace(/\/$/, "");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const HOP_BY_HOP = new Set(["host", "connection", "keep-alive", "transfer-encoding", "upgrade", "proxy-connection"]);

function buildTarget(pathSegments: string[], search: string) {
  const path = pathSegments.length ? pathSegments.join("/") : "";
  return `${backendBase()}/api/v1/${path}${search}`;
}

async function proxy(request: NextRequest, slug: string[]) {
  const target = buildTarget(slug, request.nextUrl.search);

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    init.body = request.body;
    init.duplex = "half";
  }

  try {
    const res = await fetch(target, init);
    const out = new Headers(res.headers);
    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: out,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[api proxy]", target, msg);
    return NextResponse.json(
      {
        success: false,
        error: `Cannot reach backend at ${backendBase()}. Start uvicorn on that host/port and check BACKEND_ORIGIN in frontend/.env.local. (${msg})`,
        data: null,
      },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: { slug: string[] } }) {
  return proxy(req, ctx.params.slug ?? []);
}
export async function POST(req: NextRequest, ctx: { params: { slug: string[] } }) {
  return proxy(req, ctx.params.slug ?? []);
}
export async function PATCH(req: NextRequest, ctx: { params: { slug: string[] } }) {
  return proxy(req, ctx.params.slug ?? []);
}
export async function PUT(req: NextRequest, ctx: { params: { slug: string[] } }) {
  return proxy(req, ctx.params.slug ?? []);
}
export async function DELETE(req: NextRequest, ctx: { params: { slug: string[] } }) {
  return proxy(req, ctx.params.slug ?? []);
}
export async function OPTIONS(req: NextRequest, ctx: { params: { slug: string[] } }) {
  return proxy(req, ctx.params.slug ?? []);
}
