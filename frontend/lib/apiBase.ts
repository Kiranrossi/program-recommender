/**
 * Browser: always same-origin `/api/v1` (Vercel → Render proxy). Avoids cross-origin “Failed to fetch”.
 * Call `ensureRenderWarm()` before the first auth/API calls so Render can wake (free tier).
 * Server (RSC): INTERNAL_API_URL or NEXT_PUBLIC_API_URL.
 */
export function getApiUrl(): string {
  if (typeof window !== "undefined") {
    return "/api/v1";
  }
  const v =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000/api/v1";
  return v.replace(/\/$/, "");
}
