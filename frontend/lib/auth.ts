import { getApiUrl } from "./apiBase";
import { ApiEnvelope } from "./types";

export const TOKEN_KEY = "nsrcel_access_token";
export const REMEMBER_EMAIL_KEY = "nsrcel_remembered_email";

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  auth_provider: string;
  email_verified: boolean;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

function readRememberedEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(REMEMBER_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // no-op
  }
}

export function getAuthHeaders(): Record<string, string> {
  const t = getAccessToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export function setRememberedEmail(email: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (email) localStorage.setItem(REMEMBER_EMAIL_KEY, email);
    else localStorage.removeItem(REMEMBER_EMAIL_KEY);
  } catch {
    // no-op
  }
}

export function getRememberedEmail(): string {
  return readRememberedEmail();
}

async function extractError(response: Response, fallback: string): Promise<string> {
  const text = await response.text().catch(() => "");
  if (!text) {
    if (response.status === 404) {
      return "Not found (404). Check BACKEND_ORIGIN in frontend/.env.local matches the API, or restart the FastAPI app from this repo.";
    }
    return `${fallback} (HTTP ${response.status})`;
  }
  try {
    const data = JSON.parse(text) as Record<string, unknown>;
    if (typeof data?.error === "string" && data.error.trim()) return data.error;
    const d = data?.detail;
    if (typeof d === "string" && d.trim()) return d;
    if (Array.isArray(d) && d.length && typeof (d[0] as { msg?: string })?.msg === "string") {
      return (d as { msg: string }[]).map((x) => x.msg).join("; ");
    }
  } catch {
    return text.length > 500 ? `${text.slice(0, 500)}…` : text;
  }
  if (response.status === 404) {
    return "Not found (404). Check BACKEND_ORIGIN in frontend/.env.local matches the API, or restart the FastAPI app from this repo.";
  }
  return `${fallback} (HTTP ${response.status})`;
}

export async function loginLegacyAdmin(username: string, password: string): Promise<TokenResponse> {
  // Same-origin proxy (/api/admin/legacy-login) avoids browser CORS to Render and "Failed to fetch".
  const url =
    typeof window !== "undefined"
      ? "/api/admin/legacy-login"
      : `${getApiUrl()}/auth/legacy-admin`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "Admin API not found — run `cd backend && npm run dev` (port 8000), set ALLOW_LEGACY_ADMIN=true and BACKEND_ORIGIN in .env files, then restart Next."
      );
    }
    let msg = await extractError(response, "Admin sign in failed");
    if (response.status === 502 || response.status === 504) {
      msg += " Open https://program-recommender-tzdb.onrender.com/api/v1/health in a new tab, wait for JSON, then try again (free Render can take 30–60s to wake).";
    }
    if (response.status === 401) {
      msg +=
        " Use the exact LEGACY_ADMIN_USERNAME and LEGACY_ADMIN_PASSWORD from Render → Environment (defaults: karthig / 1234 if unset).";
    }
    throw new Error(msg);
  }
  const envelope = (await response.json()) as ApiEnvelope<TokenResponse>;
  if (!envelope.success || !envelope.data) throw new Error(envelope.error ?? "Admin sign in failed");
  return envelope.data;
}

export async function loginWithPassword(email: string, password: string): Promise<TokenResponse> {
  const response = await fetch(`${getApiUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(await extractError(response, "Sign in failed"));
  const envelope = (await response.json()) as ApiEnvelope<TokenResponse>;
  if (!envelope.success || !envelope.data) throw new Error(envelope.error ?? "Sign in failed");
  return envelope.data;
}

export async function registerAccount(payload: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  account_kind: "founder" | "team";
  invite_code?: string;
}): Promise<TokenResponse> {
  const response = await fetch(`${getApiUrl()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await extractError(response, "Could not create account"));
  const envelope = (await response.json()) as ApiEnvelope<TokenResponse>;
  if (!envelope.success || !envelope.data) throw new Error(envelope.error ?? "Could not create account");
  return envelope.data;
}

export async function loginWithGoogleCredential(credential: string): Promise<TokenResponse> {
  const response = await fetch(`${getApiUrl()}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!response.ok) throw new Error(await extractError(response, "Google sign-in failed"));
  const envelope = (await response.json()) as ApiEnvelope<TokenResponse>;
  if (!envelope.success || !envelope.data) throw new Error(envelope.error ?? "Google sign-in failed");
  return envelope.data;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await fetch(`${getApiUrl()}/auth/me`, {
    cache: "no-store",
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error(await extractError(response, "Not authenticated"));
  const envelope = (await response.json()) as ApiEnvelope<AuthUser>;
  if (!envelope.success || !envelope.data) throw new Error(envelope.error ?? "Not authenticated");
  return envelope.data;
}

export function clearSession(): void {
  setAccessToken(null);
}
