import {
  AdminApplicationDetail,
  AdminApplication,
  ApiEnvelope,
  ApplicantApplication,
  ApplicationCreatePayload,
  ApplicationCreateResult,
  ApplicationStatus,
  DecisionPayload,
  EvaluationResult,
  PaginatedApplications,
  Program,
  ProgramOption,
  SimulationResult,
} from "./types";
import { getApiUrl } from "./apiBase";
import { fetchWithTimeout } from "./fetchWithTimeout";
import { getAuthHeaders } from "./auth";
import { ensureRenderWarm } from "./wakeApi";

function withAuth(headers?: HeadersInit): HeadersInit {
  const auth = getAuthHeaders();
  if (!headers) return auth;
  return { ...auth, ...(headers as Record<string, string>) };
}

/** Where /uploads and static API files are served (FastAPI), not Next. */
export function getApiOrigin(): string {
  if (typeof window !== "undefined") {
    const o = process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.trim();
    if (o) return o.replace(/\/$/, "");
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  const fromApi = getApiUrl().replace(/\/api\/v1\/?$/, "");
  if (fromApi) return fromApi.replace(/\/$/, "");
  return (process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://127.0.0.1:8000").replace(/\/$/, "");
}

async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    if (typeof window !== "undefined") {
      await ensureRenderWarm();
    }
    return typeof window !== "undefined" ? await fetchWithTimeout(url, init) : await fetch(url, init);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("timed out")) throw e;
    // In the browser, failed network/CORS/offline usually throws TypeError or "Failed to fetch"
    if (typeof window !== "undefined") {
      const looksNetwork =
        e instanceof TypeError ||
        msg === "Failed to fetch" ||
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("Load failed") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("Network request failed");
      if (looksNetwork) {
        const isLocal =
          typeof window !== "undefined" &&
          (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
        throw new Error(
          isLocal
            ? "Cannot reach the API. Start the backend: cd backend && uvicorn app.main:app --host 127.0.0.1 --port 8000 — and set frontend/.env.local."
            : "Cannot reach the API. Check NEXT_PUBLIC_API_URL and BACKEND_CORS_ORIGINS (Vercel + Render), or open your API /api/v1/health once to wake Render."
        );
      }
    }
    throw e;
  }
}

async function extractError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.error === "string" && data.error.trim()) return data.error;
    if (typeof data?.detail === "string" && data.detail.trim()) return data.detail;
  } catch {
    // no-op
  }
  return fallback;
}

export async function fetchPrograms(): Promise<Program[]> {
  const base = getApiUrl();
  const response = await safeFetch(`${base}/programs`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await extractError(response, "Failed to fetch programs"));
  }

  const envelope = (await response.json()) as ApiEnvelope<Program[]>;
  if (!envelope.success) {
    throw new Error(envelope.error ?? "Unexpected API error");
  }
  return envelope.data;
}

export async function fetchProgramOptions(): Promise<ProgramOption[]> {
  const base = getApiUrl();
  const response = await safeFetch(`${base}/programs/options`, { cache: "no-store" });
  if (!response.ok) throw new Error(await extractError(response, "Failed to fetch program options"));
  const envelope = (await response.json()) as ApiEnvelope<ProgramOption[]>;
  if (!envelope.success) throw new Error(envelope.error ?? "Unexpected API error");
  return envelope.data;
}

/** Build full Program rows for UI (cards, tags) from /programs/options — avoids /programs serialization edge cases. */
export function programOptionsToPrograms(options: ProgramOption[]): Program[] {
  return options.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    description: o.description ?? null,
    criteria: o.criteria && typeof o.criteria === "object" ? o.criteria : {},
    is_active: true,
    application_deadline: null,
    max_intake: null,
  }));
}

export async function createApplication(payload: ApplicationCreatePayload): Promise<ApplicationCreateResult> {
  const base = getApiUrl();
  const response = await safeFetch(`${base}/applications`, {
    method: "POST",
    headers: withAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await extractError(response, "Failed to create application"));
  const envelope = (await response.json()) as ApiEnvelope<ApplicationCreateResult>;
  if (!envelope.success) throw new Error(envelope.error ?? "Unexpected API error");
  return envelope.data;
}

export async function getApplicationStatus(applicationId: string): Promise<ApplicationStatus> {
  const base = getApiUrl();
  const response = await safeFetch(`${base}/applications/${applicationId}/status`, {
    cache: "no-store",
    headers: withAuth(),
  });
  if (!response.ok) throw new Error("Failed to fetch application status");
  const envelope = (await response.json()) as ApiEnvelope<ApplicationStatus>;
  if (!envelope.success) throw new Error(envelope.error ?? "Unexpected API error");
  return envelope.data;
}

export async function getApplication(applicationId: string): Promise<ApplicantApplication> {
  const base = getApiUrl();
  const response = await safeFetch(`${base}/applications/${applicationId}`, { cache: "no-store", headers: withAuth() });
  if (!response.ok) throw new Error("Failed to fetch application");
  const envelope = (await response.json()) as ApiEnvelope<ApplicantApplication>;
  if (!envelope.success) throw new Error(envelope.error ?? "Unexpected API error");
  return envelope.data;
}

export async function getEvaluationResult(applicationId: string): Promise<EvaluationResult> {
  const base = getApiUrl();
  const response = await safeFetch(`${base}/applications/${applicationId}/evaluation-result`, {
    cache: "no-store",
    headers: withAuth(),
  });
  if (!response.ok) throw new Error("Failed to fetch evaluation");
  const envelope = (await response.json()) as ApiEnvelope<EvaluationResult>;
  if (!envelope.success) throw new Error(envelope.error ?? "Unexpected API error");
  return envelope.data;
}

export async function fetchAdminApplications(filters?: {
  status?: string;
  stage?: string;
  sector?: string;
  min_score?: number;
}): Promise<AdminApplication[]> {
  const base = getApiUrl();
  const query = new URLSearchParams({ page: "1", limit: "100" });
  if (filters?.status && filters.status !== "all") query.set("status", filters.status);
  if (filters?.stage && filters.stage !== "all") query.set("stage", filters.stage);
  if (filters?.sector && filters.sector !== "all") query.set("sector", filters.sector);
  if (typeof filters?.min_score === "number" && !Number.isNaN(filters.min_score)) query.set("min_score", String(filters.min_score));
  const response = await safeFetch(`${base}/admin/applications?${query.toString()}`, {
    cache: "no-store",
    headers: withAuth(),
  });
  if (!response.ok) throw new Error("Failed to fetch admin applications");
  const envelope = (await response.json()) as ApiEnvelope<PaginatedApplications>;
  if (!envelope.success) throw new Error(envelope.error ?? "Unexpected API error");
  return envelope.data.items;
}

export async function shortlistApplication(applicationId: string): Promise<void> {
  const base = getApiUrl();
  const response = await safeFetch(`${base}/admin/applications/${applicationId}/shortlist`, {
    method: "POST",
    headers: withAuth(),
  });
  if (!response.ok) throw new Error(await extractError(response, "Failed to shortlist application"));
}

export async function decideApplication(applicationId: string, payload: DecisionPayload): Promise<void> {
  const base = getApiUrl();
  const response = await safeFetch(`${base}/admin/applications/${applicationId}/decision`, {
    method: "POST",
    headers: withAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await extractError(response, "Failed to record decision"));
}

export async function getAdminApplicationDetail(applicationId: string): Promise<AdminApplicationDetail> {
  const base = getApiUrl();
  const response = await safeFetch(`${base}/admin/applications/${applicationId}`, {
    cache: "no-store",
    headers: withAuth(),
  });
  if (!response.ok) throw new Error(await extractError(response, "Failed to fetch application detail"));
  const envelope = (await response.json()) as ApiEnvelope<AdminApplicationDetail>;
  if (!envelope.success) throw new Error(envelope.error ?? "Unexpected API error");
  return envelope.data;
}

export async function submitHitlReview(
  applicationId: string,
  payload: {
    qualitative_notes?: string;
    video_assessment?: string;
    deck_assessment?: string;
    team_assessment?: string;
    reviewer_score_override?: number;
    recommended_program_id?: string;
    verdict: "shortlist" | "reject" | "offer" | "hold";
  }
): Promise<void> {
  const base = getApiUrl();
  const response = await safeFetch(`${base}/admin/applications/${applicationId}/review`, {
    method: "PATCH",
    headers: withAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await extractError(response, "Failed to submit HITL review"));
}

export async function uploadApplicationAsset(
  applicationId: string,
  payload: { file?: File; video_url?: string }
): Promise<string> {
  const base = getApiUrl();
  const formData = new FormData();
  if (payload.file) formData.append("file", payload.file);
  if (payload.video_url) formData.append("video_url", payload.video_url);
  const response = await safeFetch(`${base}/applications/${applicationId}/files`, {
    method: "POST",
    headers: withAuth(),
    body: formData,
  });
  if (!response.ok) throw new Error(await extractError(response, "Failed to upload asset"));
  const envelope = (await response.json()) as ApiEnvelope<{ file_url: string }>;
  if (!envelope.success) throw new Error(envelope.error ?? "Unexpected API error");
  return envelope.data.file_url;
}

export async function runSimulation(application_count: number): Promise<SimulationResult> {
  const base = getApiUrl();
  const response = await safeFetch(`${base}/simulations/run?application_count=${application_count}`, {
    method: "POST",
    headers: withAuth(),
  });
  if (!response.ok) throw new Error(await extractError(response, "Failed to run simulation"));
  const envelope = (await response.json()) as ApiEnvelope<SimulationResult>;
  if (!envelope.success) throw new Error(envelope.error ?? "Unexpected API error");
  return envelope.data;
}
