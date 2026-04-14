/**
 * Browser: always same-origin `/api/v1` (Vercel → Render proxy). Avoids cross-origin “Failed to fetch”.
 * Call `ensureRenderWarm()` before the first auth/API calls so Render can wake (free tier).
 * Server (RSC): INTERNAL_API_URL or NEXT_PUBLIC_API_URL.
 */
export function getApiUrl(): string {
  if (typeof window !== "undefined") {
    return "/api/v1";
  }
  const internal = process.env.INTERNAL_API_URL?.trim();
  if (internal) return internal.replace(/\/$/, "");
  const pub = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (pub) return pub.replace(/\/$/, "");
  const backend = process.env.BACKEND_ORIGIN?.trim();
  if (backend) return `${backend.replace(/\/$/, "")}/api/v1`;
  return "http://127.0.0.1:8000/api/v1";
}
