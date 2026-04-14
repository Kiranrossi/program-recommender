const KEY = "nsrcel_render_warmed_v2";

let inflight: Promise<void> | null = null;

/**
 * Render free tier sleeps; Vercel’s proxy (~10s limit) dies before the API wakes.
 * Fire a no-cors GET (still hits the server and wakes it) without CORS.
 * Once per tab session, wait ~2.5s so the next same-origin `/api/v1` proxy call succeeds.
 */
export function ensureRenderWarm(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  try {
    if (sessionStorage.getItem(KEY) === "1") return Promise.resolve();
  } catch {
    /* private mode */
  }
  if (inflight) return inflight;

  inflight = (async () => {
    const base = process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.trim()?.replace(/\/$/, "");
    if (!base) {
      inflight = null;
      return;
    }
    try {
      fetch(`${base}/api/v1/health`, { mode: "no-cors", cache: "no-store" }).catch(() => {});
    } catch {
      /* noop */
    }
    await new Promise((r) => setTimeout(r, 2500));
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* noop */
    }
    inflight = null;
  })();

  return inflight;
}
