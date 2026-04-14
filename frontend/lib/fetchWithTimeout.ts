/** Render free tier can take 30–60s+ to cold-start; Vercel’s proxy often times out first. Long client timeout avoids “stuck” sign-in. */
const BROWSER_MS = 120_000;

export async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  if (typeof window === "undefined") {
    return fetch(url, init);
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), BROWSER_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    if (name === "AbortError") {
      throw new Error(
        "Request timed out (2 min). If your API is on Render’s free tier, open your API /api/v1/health in a new tab, wait until you see JSON, then try signing in again."
      );
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}
