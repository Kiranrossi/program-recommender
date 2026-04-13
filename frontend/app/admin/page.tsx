"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { decideApplication, fetchAdminApplications, getAdminApplicationDetail, getApiOrigin, submitHitlReview } from "@/lib/api";
import { AdminApplication, AdminApplicationDetail } from "@/lib/types";
import BackToHome from "@/components/BackToHome";
import { clearAdminSession } from "@/lib/adminAuth";

export default function AdminPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminApplication[]>([]);
  const [message, setMessage] = useState("Loading applications...");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("0");
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<AdminApplicationDetail | null>(null);
  const [note, setNote] = useState("");
  const [verdict, setVerdict] = useState<"shortlist" | "reject" | "offer" | "hold">("hold");
  const [overrideProgramId, setOverrideProgramId] = useState("");

  const reload = useCallback(async () => {
    const items = await fetchAdminApplications({
      status: statusFilter,
      stage: stageFilter,
      sector: sectorFilter,
      min_score: Number(scoreFilter || "0"),
    });
    setRows(items);
    setMessage(items.length ? "" : "No applications yet.");
    if (!selectedId && items[0]) setSelectedId(items[0].id);
  }, [selectedId, statusFilter, stageFilter, sectorFilter, scoreFilter]);

  useEffect(() => {
    reload().catch(() => setMessage("Unable to load admin applications."));
  }, [reload]);

  useEffect(() => {
    if (!selectedId) return;
    getAdminApplicationDetail(selectedId)
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [selectedId]);

  const visibleRows = rows;
  const stageOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => (row.stage ?? "").trim()).filter(Boolean))).sort(),
    [rows]
  );
  const sectorOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => (row.sector ?? "").trim()).filter(Boolean))).sort(),
    [rows]
  );

  const apiOrigin = useMemo(() => getApiOrigin(), []);

  return (
    <main className="min-h-screen w-full bg-[#0f1117] px-3 py-6 text-white md:px-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <BackToHome />
        <button
          type="button"
          onClick={() => {
            clearAdminSession();
            router.replace("/admin/sign-in");
          }}
          className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/45 hover:border-white/25 hover:text-white/80"
        >
          Sign out
        </button>
      </div>
      <div className="grid min-h-[78vh] grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-sm md:grid-cols-[250px_1fr_420px]">
        <aside className="border-r border-white/10 bg-black/25 p-4">
          <div className="mb-4 border-b border-white/10 pb-4">
            <p className="text-sm font-semibold text-white">NSRCEL</p>
            <p className="text-xs text-white/40">Reviewer portal</p>
          </div>
          <nav className="space-y-1 text-sm">
            <button onClick={() => setStatusFilter("all")} className="w-full rounded-lg bg-[#8B1A1A]/20 px-3 py-2 text-left font-semibold text-white ring-1 ring-[#8B1A1A]/40">
              Applications ({rows.length})
            </button>
            <button onClick={() => setStatusFilter("shortlisted")} className="w-full rounded-lg px-3 py-2 text-left text-white/55 hover:bg-white/[0.04]">
              Shortlisted ({rows.filter((r) => r.status === "shortlisted").length})
            </button>
            <button onClick={() => setStatusFilter("offered")} className="w-full rounded-lg px-3 py-2 text-left text-white/55 hover:bg-white/[0.04]">
              Offered ({rows.filter((r) => r.status === "offered").length})
            </button>
            <button onClick={() => setStatusFilter("rejected")} className="w-full rounded-lg px-3 py-2 text-left text-white/55 hover:bg-white/[0.04]">
              Rejected ({rows.filter((r) => r.status === "rejected").length})
            </button>
            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-xs text-white/45">
              Reviewer availability:
              <br />
              Arjith - Mon/Wed/Fri, 9:00 AM onwards
            </div>
          </nav>
        </aside>

        <section className="border-r border-white/10 bg-[#0f1117]/80">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
            <h1 className="text-xl font-semibold text-white">All applications</h1>
            <div className="flex gap-2">
              <Link className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:border-white/30" href="/admin/simulation">
                Simulation Mode
              </Link>
              <button
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:border-white/30"
                onClick={() => {
                  const header = ["founder_name", "startup_name", "city", "status", "scoring_status", "submitted_at"];
                  const lines = [
                    header.join(","),
                    ...visibleRows.map((row) =>
                      [row.founder_name, row.startup_name, row.city, row.status, row.scoring_status, row.submitted_at ?? ""]
                        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
                        .join(",")
                    ),
                  ];
                  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "nsrcel_applications.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export CSV
              </button>
              <span className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs text-white/45">Detailed review in right panel</span>
            </div>
          </header>

          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-5 py-3">
            {[
              { key: "all", label: "All" },
              { key: "under_review", label: "Under review" },
              { key: "shortlisted", label: "Shortlisted" },
              { key: "offered", label: "Offered" },
              { key: "rejected", label: "Rejected" },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  statusFilter === filter.key ? "border-[#8B1A1A] bg-[#8B1A1A]/20 text-[#F0997B]" : "border-white/10 text-white/50 hover:border-white/20"
                }`}
              >
                {filter.label}
              </button>
            ))}
            <select
              className="rounded-lg border border-white/12 bg-white/[0.05] px-2 py-1 text-xs text-white"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
            >
              <option value="all" className="bg-[#1a1d26]">
                All stages
              </option>
              {stageOptions.map((stage) => (
                <option key={stage} value={stage} className="bg-[#1a1d26]">
                  {stage}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-white/12 bg-white/[0.05] px-2 py-1 text-xs text-white"
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
            >
              <option value="all" className="bg-[#1a1d26]">
                All sectors
              </option>
              {sectorOptions.map((sector) => (
                <option key={sector} value={sector} className="bg-[#1a1d26]">
                  {sector}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1 text-xs text-white/45">
              <span>Min score</span>
              <input
                type="number"
                min={0}
                max={100}
                className="w-16 rounded-lg border border-white/12 bg-white/[0.05] px-2 py-1 text-xs text-white"
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value)}
              />
            </div>
          </div>

          {message && <p className="px-5 py-3 text-sm text-[#F0997B]">{message}</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-sm text-white/45">
                <tr>
                  <th className="px-5 py-3 font-medium">Founder / Startup</th>
                  <th className="px-5 py-3 font-medium">City</th>
                  <th className="px-5 py-3 font-medium">Stage/Sector</th>
                  <th className="px-5 py-3 font-medium">Score</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr
                    className={`cursor-pointer border-b border-white/[0.06] hover:bg-white/[0.03] ${selectedId === row.id ? "bg-[#8B1A1A]/10" : ""}`}
                    key={row.id}
                    onClick={() => setSelectedId(row.id)}
                  >
                    <td className="px-5 py-3">
                      <p className="font-semibold text-white">{row.founder_name}</p>
                      <p className="text-sm text-white/45">{row.startup_name}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-white/70">
                      {row.city}
                      {row.is_tier2_city && (
                        <span className="ml-2 rounded bg-[#EF9F27]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#FAC775]">T2</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-white/70">
                      {(row.stage ?? "idea").toUpperCase()} / {(row.sector ?? "general")}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <span className="rounded bg-white/[0.08] px-2 py-1 text-[10px] text-white/80">
                          {row.max_final_score != null ? row.max_final_score.toFixed(2) : "-"}
                        </span>
                        <button
                          className="rounded bg-[#1D9E75] px-2 py-1 text-[10px] text-white hover:opacity-90"
                          onClick={async () => {
                            try {
                              await decideApplication(row.id, { outcome: "offered" });
                              await reload();
                            } catch (e) {
                              setMessage(e instanceof Error ? e.message : "Offer failed");
                            }
                          }}
                        >
                          Approve
                        </button>
                        <button
                          className="rounded bg-red-700 px-2 py-1 text-[10px] text-white hover:opacity-90"
                          onClick={async () => {
                            try {
                              await decideApplication(row.id, { outcome: "rejected", rejection_reason: "Not aligned in current cohort" });
                              await reload();
                            } catch (e) {
                              setMessage(e instanceof Error ? e.message : "Reject failed");
                            }
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-white/[0.08] px-2 py-1 text-xs text-white/75">{row.status}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-white/40">{row.submitted_at ? new Date(row.submitted_at).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="bg-black/20 p-4">
          <h2 className="text-sm font-semibold text-white">Application review (HITL)</h2>
          {!detail && <p className="mt-2 text-xs text-white/40">Select an application to review details.</p>}
          {detail && (
            <div className="mt-3 space-y-3 text-sm text-white/85">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="font-semibold text-white">{detail.application.startup_name}</p>
                <p className="text-xs text-white/45">Founder: {detail.application.founder_name}</p>
                <p className="mt-1 text-xs text-white/70">Status: {detail.application.status}</p>
                <p className="text-xs text-white/70">Assigned program: {detail.application.assigned_program_id ?? "Pending"}</p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs font-semibold text-white">AI scores</p>
                <div className="mt-2 space-y-2">
                  {detail.scores.slice(0, 3).map((score) => (
                    <div key={score.id} className="rounded-lg bg-black/30 p-2">
                      <p className="text-xs text-white/80">
                        Program: {String(score.total_score ?? "-")} | Preference: {String(score.preference_score ?? "-")} | Final:{" "}
                        {String(score.final_score ?? "-")}
                      </p>
                      {score.score_breakdown && (
                        <p className="mt-1 text-[11px] text-white/50">
                          Stage {score.score_breakdown.stage_fit}, Sector {score.score_breakdown.sector_fit}, Traction {score.score_breakdown.traction},
                          Impact {score.score_breakdown.social_impact}, Geo {score.score_breakdown.geography_bonus}
                        </p>
                      )}
                      {score.explainability_summary && <p className="mt-1 text-[11px] text-white/50">{score.explainability_summary}</p>}
                      <p className="mt-1 text-[11px] text-white/50">{score.ai_reasoning ?? "No reasoning"}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <label className="text-xs font-semibold text-white">Reviewer notes</label>
                <textarea
                  className="mt-2 w-full rounded-lg border border-white/12 bg-white/[0.05] px-2 py-1.5 text-xs text-white placeholder:text-white/30"
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Qualitative assessment of startup/team"
                />
                <input
                  className="mt-2 w-full rounded-lg border border-white/12 bg-white/[0.05] px-2 py-1.5 text-xs text-white placeholder:text-white/30"
                  value={overrideProgramId}
                  onChange={(e) => setOverrideProgramId(e.target.value)}
                  placeholder="Override program id (optional UUID)"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <select
                    className="rounded-lg border border-white/12 bg-white/[0.05] px-2 py-1 text-xs text-white"
                    value={verdict}
                    onChange={(e) => setVerdict(e.target.value as "shortlist" | "reject" | "offer" | "hold")}
                  >
                    <option value="hold" className="bg-[#1a1d26]">
                      Hold
                    </option>
                    <option value="shortlist" className="bg-[#1a1d26]">
                      Shortlist
                    </option>
                    <option value="offer" className="bg-[#1a1d26]">
                      Offer
                    </option>
                    <option value="reject" className="bg-[#1a1d26]">
                      Reject
                    </option>
                  </select>
                  <button
                    className="rounded-lg bg-[#8B1A1A] px-2 py-1 text-xs text-white hover:bg-[#a02020]"
                    onClick={async () => {
                      try {
                        await submitHitlReview(detail.application.id, {
                          qualitative_notes: note,
                          video_assessment: note,
                          deck_assessment: note,
                          team_assessment: note,
                          recommended_program_id: overrideProgramId || undefined,
                          verdict,
                        });
                        setMessage("HITL review submitted.");
                        await reload();
                        const refreshed = await getAdminApplicationDetail(detail.application.id);
                        setDetail(refreshed);
                      } catch (e) {
                        setMessage(e instanceof Error ? e.message : "Review submission failed");
                      }
                    }}
                  >
                    Save HITL Review
                  </button>
                  <button
                    className="rounded-lg bg-[#1D9E75] px-2 py-1 text-xs text-white hover:opacity-90"
                    onClick={async () => {
                      try {
                        await decideApplication(detail.application.id, { outcome: "offered" });
                        setMessage("Application approved.");
                        await reload();
                        const refreshed = await getAdminApplicationDetail(detail.application.id);
                        setDetail(refreshed);
                      } catch (e) {
                        setMessage(e instanceof Error ? e.message : "Approve failed");
                      }
                    }}
                  >
                    Approve
                  </button>
                  <button
                    className="rounded-lg bg-red-700 px-2 py-1 text-xs text-white hover:opacity-90"
                    onClick={async () => {
                      try {
                        await decideApplication(detail.application.id, { outcome: "rejected", rejection_reason: "Reviewer rejected" });
                        setMessage("Application rejected.");
                        await reload();
                        const refreshed = await getAdminApplicationDetail(detail.application.id);
                        setDetail(refreshed);
                      } catch (e) {
                        setMessage(e instanceof Error ? e.message : "Reject failed");
                      }
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs font-semibold text-white">Pitch assets</p>
                <div className="mt-2 flex flex-col gap-1 text-xs">
                  {detail.application.pitch_deck_url ? (
                    <a
                      href={`${apiOrigin}${detail.application.pitch_deck_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#7CB9FF] underline hover:text-white"
                    >
                      Open pitch deck
                    </a>
                  ) : (
                    <span className="text-white/40">No pitch deck uploaded</span>
                  )}
                  {detail.application.video_pitch_url ? (
                    <a href={detail.application.video_pitch_url} target="_blank" rel="noreferrer" className="text-[#7CB9FF] underline hover:text-white">
                      Open video pitch
                    </a>
                  ) : (
                    <span className="text-white/40">No video pitch uploaded</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
