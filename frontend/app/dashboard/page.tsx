"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  fetchProgramOptions,
  getApiOrigin,
  getApplication,
  getApplicationStatus,
  getEvaluationResult,
  uploadApplicationAsset,
} from "@/lib/api";
import { ApplicantApplication, ApplicationStatus, EvaluationResult, ProgramOption } from "@/lib/types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function appStatusChip(status: string): { label: string; className: string } {
  const s = status.toLowerCase();
  if (s === "under_review" || s === "scoring") return { label: "Under review", className: "bg-[rgba(239,159,39,0.15)] text-[#FAC775] border border-[rgba(239,159,39,0.2)]" };
  if (s === "shortlisted") return { label: "Shortlisted", className: "bg-[rgba(29,158,117,0.15)] text-[#5DCAA5] border border-[rgba(29,158,117,0.2)]" };
  if (s === "offered") return { label: "Offered", className: "bg-[rgba(29,158,117,0.15)] text-[#5DCAA5] border border-[rgba(29,158,117,0.2)]" };
  if (s === "rejected") return { label: "Rejected", className: "bg-red-500/10 text-red-300 border border-red-500/20" };
  if (s === "submitted") return { label: "Submitted", className: "bg-white/[0.06] text-white/35 border border-white/10" };
  return { label: status.replaceAll("_", " "), className: "bg-white/[0.06] text-white/35 border border-white/10" };
}

export default function DashboardPage() {
  const [appId, setAppId] = useState("");
  const [appRecord, setAppRecord] = useState<ApplicantApplication | null>(null);
  const [status, setStatus] = useState<ApplicationStatus | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [message, setMessage] = useState("Loading…");
  const [uploadMsg, setUploadMsg] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const apiOrigin = useMemo(() => getApiOrigin(), []);

  useEffect(() => {
    const saved = localStorage.getItem("nsrcel_application_id") || "";
    if (!saved) {
      setMessage("No submitted application yet. Start from Apply.");
      return;
    }
    setAppId(saved);
    (async () => {
      try {
        const [rec, st, opts, ev] = await Promise.all([
          getApplication(saved),
          getApplicationStatus(saved),
          fetchProgramOptions(),
          getEvaluationResult(saved).catch(() => null),
        ]);
        setAppRecord(rec);
        setStatus(st);
        setPrograms(opts);
        setEvaluation(ev);
        setVideoUrl(rec.video_pitch_url ?? "");
        setMessage("");
      } catch {
        setMessage("Unable to load dashboard. Check that the backend is running and you are signed in.");
      }
    })();
  }, []);

  const programNameById = useMemo(() => {
    const m = new Map<string, string>();
    programs.forEach((p) => m.set(p.id, p.name));
    return m;
  }, [programs]);

  const prefNames = useMemo(() => {
    if (!appRecord) return ["", "", ""];
    return [
      programNameById.get(appRecord.preference_1) ?? "—",
      programNameById.get(appRecord.preference_2) ?? "—",
      programNameById.get(appRecord.preference_3) ?? "—",
    ];
  }, [appRecord, programNameById]);

  const top = status?.explainability?.top_program_selected;
  const top3 = status?.explainability?.top_3_scores ?? [];
  const reasons = status?.explainability?.reason ?? [];

  const scoringChip =
    status?.scoring_status === "completed"
      ? { label: "Completed", className: "bg-[rgba(29,158,117,0.15)] text-[#5DCAA5] border border-[rgba(29,158,117,0.2)]" }
      : status?.scoring_status === "failed"
        ? { label: "Failed", className: "bg-red-500/10 text-red-300 border border-red-500/20" }
        : status?.scoring_status === "in_progress"
          ? { label: "In progress", className: "bg-[rgba(239,159,39,0.15)] text-[#FAC775] border border-[rgba(239,159,39,0.2)]" }
          : { label: "Pending", className: "bg-white/[0.06] text-white/35 border border-white/10" };

  const decisionChip =
    status?.decision === "offered"
      ? { label: "Offered", className: "bg-[rgba(29,158,117,0.15)] text-[#5DCAA5] border border-[rgba(29,158,117,0.2)]" }
      : status?.decision === "rejected"
        ? { label: "Rejected", className: "bg-red-500/10 text-red-300 border border-red-500/20" }
        : { label: "Pending", className: "bg-white/[0.06] text-white/35 border border-white/10" };

  const appChip = status ? appStatusChip(status.status) : appStatusChip("");

  const mainScore = top?.final_score ? Number(top.final_score) : top3[0]?.final_score ? Number(top3[0].final_score) : null;

  const timeline = useMemo(() => {
    if (!status || !appRecord) return [];
    const scoringDone = status.scoring_status === "completed";
    const scoringFailed = status.scoring_status === "failed";
    const reviewActive = scoringDone && (status.status === "under_review" || status.status === "scoring");
    const reviewDone = ["shortlisted", "offered", "rejected"].includes(status.status);
    const shortlistDone = ["offered", "rejected", "shortlisted"].includes(status.status);
    const finalDone = status.decision === "offered" || status.decision === "rejected";

    return [
      { title: "Application submitted", date: appRecord.submitted_at ? new Date(appRecord.submitted_at).toLocaleDateString() : "—", state: "done" as const },
      {
        title: scoringFailed ? "AI scoring failed" : "AI scoring completed",
        date: scoringDone ? "See score panel" : scoringFailed ? "Contact support" : "Queued",
        state: scoringDone || scoringFailed ? ("done" as const) : status.scoring_status === "in_progress" ? ("active" as const) : ("wait" as const),
      },
      {
        title: "Human review",
        date: reviewActive ? "NSRCEL team · est. 5–7 days" : reviewDone ? "Updated" : "Pending",
        state: reviewDone ? ("done" as const) : reviewActive ? ("active" as const) : ("wait" as const),
      },
      {
        title: "Shortlist decision",
        date: shortlistDone ? status.status : "Pending",
        state: shortlistDone ? ("done" as const) : ("wait" as const),
      },
      {
        title: "Final offer / rejection",
        date: finalDone ? (status.decision ?? "") : "Pending",
        state: finalDone ? ("done" as const) : ("wait" as const),
      },
    ];
  }, [status, appRecord]);

  async function refresh() {
    if (!appId) return;
    setMessage("Refreshing…");
    try {
      const [st, rec, ev] = await Promise.all([
        getApplicationStatus(appId),
        getApplication(appId),
        getEvaluationResult(appId).catch(() => null),
      ]);
      setStatus(st);
      setAppRecord(rec);
      setEvaluation(ev);
      setVideoUrl(rec.video_pitch_url ?? "");
      setMessage("");
    } catch {
      setMessage("Refresh failed.");
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] font-sans text-white">
      <header className="flex items-center justify-between border-b border-white/[0.08] px-6 py-3.5 md:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#8B1A1A] text-[11px] font-bold text-white">N</div>
          <span className="text-[13px] font-medium">NSRCEL · IIM Bangalore</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/35 hover:text-white/70"
          >
            ← Home
          </Link>
          {appRecord && (
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3C3489] text-[11px] font-medium text-[#CECBF6]">
                {initials(appRecord.founder_name)}
              </div>
              <span className="max-w-[140px] truncate text-xs text-white/50">{appRecord.founder_name}</span>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[960px] px-6 py-10 md:px-10">
        <div className="mb-8">
          <h1 className="text-[22px] font-medium text-white">Your application</h1>
          <p className="mt-1 text-[13px] text-white/35">
            {appRecord ? (
              <>
                {appRecord.startup_name}
                {appRecord.submitted_at ? ` · Applied ${new Date(appRecord.submitted_at).toLocaleDateString()}` : ""}
              </>
            ) : (
              "Sign in and submit an application to track it here."
            )}
          </p>
        </div>

        {message && <p className="mb-6 text-sm text-amber-200/90">{message}</p>}

        {!appId && (
          <Link href="/apply" className="inline-block rounded-lg bg-[#8B1A1A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#a02020]">
            Start application
          </Link>
        )}

        {appId && appRecord && status && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
            <div className="flex flex-col gap-4">
              <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                  <span className="text-[13px] font-medium">Application status</span>
                  <button
                    type="button"
                    onClick={() => refresh()}
                    className="rounded border border-white/10 px-2.5 py-1 text-[11px] text-white/30 hover:border-white/30 hover:text-white"
                  >
                    Refresh
                  </button>
                </div>
                <div className="px-5 py-5">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                    <span className="text-xs text-white/35">Application</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${appChip.className}`}>{appChip.label}</span>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <span className="text-xs text-white/35">AI scoring</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${scoringChip.className}`}>{scoringChip.label}</span>
                  </div>
                  <div className="flex items-center justify-between pb-4">
                    <span className="text-xs text-white/35">Final decision</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${decisionChip.className}`}>{decisionChip.label}</span>
                  </div>
                  <p className="text-[11px] text-white/25">Assigned program</p>
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-[rgba(139,26,26,0.3)] bg-[rgba(139,26,26,0.12)] px-3.5 py-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[rgba(139,26,26,0.3)]">
                      <svg viewBox="0 0 13 13" className="h-3.5 w-3.5 fill-none stroke-[#F0997B] stroke-[1.8]">
                        <path d="M2 11L6.5 2L11 11M4 8h5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">{top?.program_name ?? "Pending assignment"}</p>
                      <p className="mt-0.5 text-[11px] text-white/35">
                        {evaluation?.reasoning ? evaluation.reasoning.slice(0, 120) + (evaluation.reasoning.length > 120 ? "…" : "") : "We will update this after scoring completes."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/[0.08]" />
                <div className="px-5 pb-5 pt-2">
                  <p className="mb-3.5 text-[11px] uppercase tracking-[0.06em] text-white/25">Pipeline progress</p>
                  <div className="space-y-0">
                    {timeline.map((step, i) => (
                      <div key={step.title} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border ${
                              step.state === "done"
                                ? "border-[#1D9E75] bg-[rgba(29,158,117,0.2)]"
                                : step.state === "active"
                                  ? "border-[#EF9F27] bg-[rgba(239,159,39,0.2)]"
                                  : "border-white/10 bg-white/[0.04]"
                            }`}
                          >
                            {step.state === "done" && (
                              <svg viewBox="0 0 9 9" className="h-2.5 w-2.5 stroke-[#5DCAA5]" fill="none" strokeWidth="2">
                                <polyline points="1.5,4.5 3.5,6.5 7.5,2.5" strokeLinecap="round" />
                              </svg>
                            )}
                            {step.state === "active" && <span className="h-1.5 w-1.5 rounded-full bg-[#EF9F27]" />}
                          </div>
                          {i < timeline.length - 1 && <div className="my-0.5 min-h-[18px] w-px flex-1 bg-white/[0.08]" />}
                        </div>
                        <div className={`pb-4 pt-0.5 ${step.state === "wait" ? "opacity-50" : ""}`}>
                          <p className={`text-xs font-medium ${step.state === "wait" ? "text-white/30" : "text-white"}`}>{step.title}</p>
                          <p className="mt-0.5 text-[11px] text-white/25">{step.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-white/[0.06] px-5 py-3 font-mono text-[10px] text-white/15">
                  Application · {appId}
                </div>
              </section>

              <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                <div className="border-b border-white/[0.08] px-5 py-4">
                  <span className="text-[13px] font-medium">Pitch materials</span>
                </div>
                <div className="px-5 py-5">
                  {appRecord.pitch_deck_url && (
                    <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-[rgba(29,158,117,0.2)] bg-[rgba(29,158,117,0.08)] px-3.5 py-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[rgba(29,158,117,0.15)]">
                        <svg viewBox="0 0 13 13" className="h-3.5 w-3.5 stroke-[#5DCAA5] fill-none" strokeWidth="1.8">
                          <rect x="2" y="1" width="9" height="11" rx="1.5" />
                          <path d="M4 5h5M4 7.5h3" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white">Pitch deck on file</p>
                        <p className="text-[11px] text-white/25">PDF uploaded</p>
                      </div>
                      <a
                        href={`${apiOrigin}${appRecord.pitch_deck_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-[11px] text-white/40 hover:text-white"
                      >
                        Open
                      </a>
                    </div>
                  )}

                  <label className="flex cursor-pointer flex-col items-center rounded-lg border border-dashed border-white/15 px-5 py-5 text-center transition-colors hover:border-white/30 hover:bg-white/[0.02]">
                    <input
                      type="file"
                      accept=".pdf,.mp4,.mov,.webm"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file || !appId) return;
                        try {
                          await uploadApplicationAsset(appId, { file });
                          setUploadMsg("Upload successful.");
                          await refresh();
                        } catch (e) {
                          setUploadMsg(e instanceof Error ? e.message : "Upload failed");
                        }
                      }}
                    />
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
                      <svg viewBox="0 0 15 15" className="h-4 w-4 stroke-white/40" fill="none" strokeWidth="1.5">
                        <path d="M7.5 10V3M4.5 6L7.5 3L10.5 6M3 12h9" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="text-xs text-white/40">Upload or replace pitch deck</p>
                    <p className="mt-1 text-[11px] text-white/20">PDF · Max 20 MB</p>
                  </label>

                  <p className="mb-2 mt-5 text-[11px] text-white/25">Video pitch link</p>
                  <div className="flex gap-2">
                    <input
                      className="min-w-0 flex-1 rounded-lg border border-white/12 bg-white/[0.05] px-3 py-2 text-xs text-white placeholder:text-white/20 focus:border-[#8B1A1A]/60 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/20"
                      placeholder="Paste YouTube / Drive / Loom URL"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      className="shrink-0 rounded-lg bg-[#8B1A1A] px-4 py-2 text-xs font-medium text-white hover:bg-[#a02020]"
                      onClick={async () => {
                        if (!videoUrl || !appId) return;
                        try {
                          await uploadApplicationAsset(appId, { video_url: videoUrl });
                          setUploadMsg("Video link saved.");
                          await refresh();
                        } catch (e) {
                          setUploadMsg(e instanceof Error ? e.message : "Save failed");
                        }
                      }}
                    >
                      Save
                    </button>
                  </div>
                  {uploadMsg && <p className="mt-2 text-[11px] text-white/40">{uploadMsg}</p>}
                </div>
              </section>

              <div className="flex flex-wrap gap-2">
                <Link href="/apply" className="rounded-lg border border-white/15 px-4 py-2 text-xs text-white/70 hover:border-white/30">
                  New application
                </Link>
              </div>
            </div>

            <aside className="flex flex-col gap-4">
              <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                  <span className="text-[13px] font-medium">Your C2R score</span>
                  <span className="text-[11px] text-[#5DCAA5]/80">AI evaluated</span>
                </div>
                <div className="px-5 py-5">
                  {mainScore != null && !Number.isNaN(mainScore) ? (
                    <>
                      <div className="mb-4 flex items-baseline gap-1.5">
                        <span className="text-4xl font-medium tracking-tight text-[#5DCAA5]">{Math.round(mainScore)}</span>
                        <span className="text-sm text-white/25">/ 100</span>
                      </div>
                      <div className="space-y-1.5">
                        {top3.slice(0, 6).map((row, idx) => {
                          const v = row.final_score != null ? Number(row.final_score) : 0;
                          const w = Math.min(100, Math.max(0, v));
                          const mid = idx === 2;
                          return (
                            <div key={row.program_id} className="flex items-center gap-2">
                              <span className="w-24 shrink-0 text-[11px] text-white/35">{row.program_name.slice(0, 14)}</span>
                              <div className="h-[3px] flex-1 rounded-sm bg-white/[0.08]">
                                <div
                                  className={`h-[3px] rounded-sm ${mid ? "bg-[#EF9F27]" : "bg-[#1D9E75]"}`}
                                  style={{ width: `${w}%` }}
                                />
                              </div>
                              <span className="w-8 shrink-0 text-right text-[11px] text-white/40">{Math.round(v)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-white/35">Scores will appear here after AI evaluation finishes.</p>
                  )}
                  {reasons.length > 0 && (
                    <ul className="mt-3 space-y-1 border-t border-white/[0.06] pt-3 text-[11px] leading-relaxed text-white/20">
                      {reasons.map((r) => (
                        <li key={r}>• {r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              <section className="overflow-hidden rounded-xl border border-[rgba(139,26,26,0.3)] bg-[rgba(139,26,26,0.1)]">
                <div className="px-5 py-4">
                  <p className="text-xs font-medium text-white">What happens next?</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/35">
                    The NSRCEL review team evaluates your materials. You will receive email updates as your application moves through the pipeline.
                  </p>
                  <Link
                    href="/programs"
                    className="mt-3 block w-full rounded-lg bg-[#8B1A1A] py-2.5 text-center text-xs font-medium text-white hover:bg-[#a02020]"
                  >
                    Explore programs →
                  </Link>
                </div>
              </section>

              <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                <div className="border-b border-white/[0.08] px-5 py-4">
                  <span className="text-[13px] font-medium">Program preferences</span>
                </div>
                <div className="flex flex-col gap-2 px-5 py-3.5">
                  {prefNames.map((name, idx) => {
                    const matched = top?.program_name === name;
                    return (
                      <div key={`${name}-${idx}`} className="flex items-center gap-2.5">
                        <div
                          className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${
                            matched
                              ? "border border-[rgba(139,26,26,0.4)] bg-[rgba(139,26,26,0.2)] text-[#F0997B]"
                              : "border border-white/10 bg-white/[0.05] text-white/35"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span className={`text-xs ${matched ? "text-white" : "text-white/45"}`}>{name}</span>
                        {matched && <span className="ml-auto text-[10px] text-[#5DCAA5]">matched</span>}
                      </div>
                    );
                  })}
                </div>
              </section>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
