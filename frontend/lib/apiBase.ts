/**
 * Browser: use `NEXT_PUBLIC_API_URL` (your Render API) when set — avoids Vercel’s ~10s proxy limit
 * while Render cold-starts (~30–60s). CORS must allow your Vercel origin on the API. Fallback: same-origin `/api/v1`.
 * Server (RSC): INTERNAL_API_URL or NEXT_PUBLIC_API_URL.
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
