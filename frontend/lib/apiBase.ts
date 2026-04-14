/**
 * Browser: if `NEXT_PUBLIC_API_URL` is set (production), call FastAPI directly so Vercel’s
 * serverless proxy does not time out while Render cold-starts (~30–60s). Otherwise same-origin `/api/v1`.
 * Server (RSC): call FastAPI directly via INTERNAL_API_URL or NEXT_PUBLIC_API_URL.
 */
export function getApiUrl(): string {
  if (typeof window !== "undefined") {
    const pub = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (pub) return pub.replace(/\/$/, "");
    return "/api/v1";
  }
  const v =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000/api/v1";
  return v.replace(/\/$/, "");
}
