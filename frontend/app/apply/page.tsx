"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createApplication, fetchProgramOptions, uploadApplicationAsset } from "@/lib/api";
import { ProgramOption } from "@/lib/types";
import BackToHome from "@/components/BackToHome";

const DRAFT_KEY = "nsrcel_universal_apply_draft_v1";

type UniversalForm = {
  founder: { name: string; email: string; current_location: string; permanent_location: string; linkedin: string };
  startup: { name: string; stage: string; sector: string; founding_year: string; team_size: string };
  problem_solution: { problem_statement: string; target_customer: string; company_description: string; solution_description: string };
  business: { customer_segment: string; market_type: string; areas_of_operation: string; website: string; app_link: string };
  traction: { funding_status: string; funding_details: string };
  impact: { sdg_alignment: string; sector_tags: string; social_impact_score: string };
  assets: { pitch_deck: string; video_pitch: string; demo_link: string };
  preferences: { top_3_programs: string[]; expectations: string };
  metadata: { legal_status: string; registered_address: string; social_links: string; accelerator_history: string; nsrcel_history: string; discovery_source: string };
};

const EMPTY_FORM: UniversalForm = {
  founder: { name: "", email: "", current_location: "", permanent_location: "", linkedin: "" },
  startup: { name: "", stage: "idea", sector: "", founding_year: "", team_size: "" },
  problem_solution: { problem_statement: "", target_customer: "", company_description: "", solution_description: "" },
  business: { customer_segment: "", market_type: "", areas_of_operation: "", website: "", app_link: "" },
  traction: { funding_status: "", funding_details: "" },
  impact: { sdg_alignment: "", sector_tags: "", social_impact_score: "5" },
  assets: { pitch_deck: "", video_pitch: "", demo_link: "" },
  preferences: { top_3_programs: ["", "", ""], expectations: "" },
  metadata: { legal_status: "", registered_address: "", social_links: "", accelerator_history: "", nsrcel_history: "", discovery_source: "" },
};

export default function ApplyPage() {
  const steps = ["Founder Info", "Startup Info", "Problem & Solution", "Traction & Business", "Preferences & Uploads"];
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submittedAppId, setSubmittedAppId] = useState("");
  const [deckFile, setDeckFile] = useState<File | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [formData, setFormData] = useState<UniversalForm>(EMPTY_FORM);

  useEffect(() => {
    fetchProgramOptions()
      .then(setPrograms)
      .catch(() => setMessage("Unable to load program options."));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { data: UniversalForm; step: number };
      if (parsed.data) setFormData(parsed.data);
      if (parsed.step >= 1 && parsed.step <= 5) setCurrentStep(parsed.step);
    } catch {
      // ignore malformed drafts
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: formData, step: currentStep }));
    setLastSavedAt(new Date().toLocaleTimeString());
  }, [formData, currentStep]);

  function saveDraftNow() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: formData, step: currentStep }));
    setLastSavedAt(new Date().toLocaleTimeString());
    setMessage("Draft saved.");
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setMessage("Draft cleared from this browser.");
  }

  const defaults = useMemo(() => {
    const p1 = programs[0]?.id ?? "";
    const p2 = programs[1]?.id ?? p1;
    const p3 = programs[2]?.id ?? p2;
    return [p1, p2, p3];
  }, [programs]);

  useEffect(() => {
    if (!formData.preferences.top_3_programs[0] && defaults[0]) {
      setFormData((prev) => ({ ...prev, preferences: { ...prev.preferences, top_3_programs: defaults } }));
    }
  }, [defaults, formData.preferences.top_3_programs]);

  function validateStep(step: number): string | null {
    if (step === 1) {
      if (!formData.founder.name || !formData.founder.email || !formData.founder.current_location || !formData.founder.permanent_location) {
        return "Please complete required founder fields.";
      }
    }
    if (step === 2) {
      if (!formData.startup.name || !formData.startup.stage || !formData.startup.sector) return "Please complete startup name, stage and sector.";
    }
    if (step === 3) {
      if (!formData.problem_solution.problem_statement || !formData.problem_solution.solution_description) return "Problem and solution are required.";
    }
    if (step === 5) {
      const selected = formData.preferences.top_3_programs;
      if (selected.some((x) => !x)) return "Please select top 3 programs.";
      if (new Set(selected).size !== 3) return "Program preferences must be unique.";
      const requiredFields = programs.filter((program) => selected.includes(program.id)).flatMap((program) => program.required_fields ?? []);
      if (requiredFields.includes("founder.linkedin") && !formData.founder.linkedin) return "LinkedIn is required for selected program.";
      if (requiredFields.includes("assets.video_pitch") && !formData.assets.video_pitch) return "Video pitch URL is required for selected program.";
    }
    return null;
  }

  function nextStep() {
    const err = validateStep(currentStep);
    if (err) {
      setMessage(err);
      return;
    }
    setMessage(null);
    setCurrentStep((prev) => Math.min(5, prev + 1));
  }

  function prevStep() {
    setMessage(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }

  async function submitApplication() {
    if (submittedAppId) return;
    if (new Set(formData.preferences.top_3_programs).size !== 3) {
      setMessage("Program preferences must be unique. Choose 3 different programs.");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const result = await createApplication({
        founder: formData.founder,
        team: { has_cofounder: false, cofounders: [] },
        startup: { ...formData.startup, founding_year: formData.startup.founding_year ? Number(formData.startup.founding_year) : undefined, team_size: formData.startup.team_size ? Number(formData.startup.team_size) : undefined },
        problem_solution: formData.problem_solution,
        business: { ...formData.business, areas_of_operation: formData.business.areas_of_operation.split(",").map((x) => x.trim()).filter(Boolean) },
        traction: formData.traction,
        impact: {
          sdg_alignment: formData.impact.sdg_alignment.split(",").map((x) => x.trim()).filter(Boolean),
          sector_tags: formData.impact.sector_tags.split(",").map((x) => x.trim()).filter(Boolean),
          social_impact_score: Number(formData.impact.social_impact_score || "5"),
        },
        assets: formData.assets,
        preferences: {
          top_3_programs: formData.preferences.top_3_programs,
          expectations: formData.preferences.expectations.split(",").map((x) => x.trim()).filter(Boolean),
        },
        metadata: { ...formData.metadata, social_links: formData.metadata.social_links.split(",").map((x) => x.trim()).filter(Boolean) },
      });

      if (deckFile) {
        await uploadApplicationAsset(result.id, { file: deckFile });
      }
      if (formData.assets.video_pitch) {
        await uploadApplicationAsset(result.id, { video_url: formData.assets.video_pitch });
      }

      localStorage.setItem("nsrcel_application_id", result.id);
      setSubmittedAppId(result.id);
      setMessage(`Submitted successfully. Application ID: ${result.id}`);
      localStorage.removeItem(DRAFT_KEY);
      setCurrentStep(5);
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : "Submission failed.";
      setMessage(errMessage);
    } finally {
      setLoading(false);
    }
  }

  const field =
    "rounded-lg border border-white/12 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#8B1A1A]/60 focus:ring-2 focus:ring-[#8B1A1A]/15";

  return (
    <main className="min-h-screen bg-[#0f1117] px-4 py-8 text-white md:px-8">
      <div className="mb-4">
        <BackToHome />
      </div>
      <section className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] px-5 py-4 md:px-6">
          <div>
            <div className="text-sm font-semibold text-white">NSRCEL · IIM Bangalore</div>
            <div className="text-xs text-white/35">Draft auto-saved {lastSavedAt ? `at ${lastSavedAt}` : ""}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {steps.map((step, index) => (
              <span
                className={`rounded-full border px-3 py-1 text-xs ${
                  index + 1 < currentStep
                    ? "border-[#8B1A1A] bg-[#8B1A1A] text-white"
                    : index + 1 === currentStep
                      ? "border-[#8B1A1A] bg-[#8B1A1A]/15 text-[#F0997B]"
                      : "border-white/10 text-white/40"
                }`}
                key={step}
              >
                {step}
              </span>
            ))}
          </div>
        </div>

        <div className="h-1 w-full bg-white/[0.06]">
          <div className="h-1 bg-[#8B1A1A] transition-all" style={{ width: `${(currentStep / 5) * 100}%` }} />
        </div>

        <div className="mx-auto max-w-3xl px-5 py-10 md:px-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#F0997B]">Step {currentStep} of 5</p>

          {currentStep === 1 && (
            <>
              <h1 className="mt-2 text-3xl font-bold text-white">Founder Info</h1>
              <div className="mt-7 grid gap-3 md:grid-cols-2">
                <input
                  value={formData.founder.name}
                  onChange={(e) => setFormData((p) => ({ ...p, founder: { ...p.founder, name: e.target.value } }))}
                  className={field}
                  placeholder="Founder name"
                />
                <input
                  value={formData.founder.email}
                  onChange={(e) => setFormData((p) => ({ ...p, founder: { ...p.founder, email: e.target.value } }))}
                  className={field}
                  placeholder="Founder email"
                />
                <input
                  value={formData.founder.current_location}
                  onChange={(e) => setFormData((p) => ({ ...p, founder: { ...p.founder, current_location: e.target.value } }))}
                  className={field}
                  placeholder="Current location"
                />
                <input
                  value={formData.founder.permanent_location}
                  onChange={(e) => setFormData((p) => ({ ...p, founder: { ...p.founder, permanent_location: e.target.value } }))}
                  className={field}
                  placeholder="Permanent location"
                />
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <h1 className="mt-2 text-3xl font-bold text-white">Startup Info</h1>
              <div className="mt-7 grid gap-3 md:grid-cols-2">
                <input value={formData.startup.name} onChange={(e) => setFormData((p) => ({ ...p, startup: { ...p.startup, name: e.target.value } }))} className={field} placeholder="Startup name" />
                <input value={formData.startup.sector} onChange={(e) => setFormData((p) => ({ ...p, startup: { ...p.startup, sector: e.target.value } }))} className={field} placeholder="Sector" />
                <input value={formData.startup.stage} onChange={(e) => setFormData((p) => ({ ...p, startup: { ...p.startup, stage: e.target.value } }))} className={field} placeholder="Stage" />
                <input value={formData.startup.team_size} onChange={(e) => setFormData((p) => ({ ...p, startup: { ...p.startup, team_size: e.target.value } }))} className={field} placeholder="Team size" />
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <h1 className="mt-2 text-3xl font-bold text-white">Problem & Solution</h1>
              <div className="mt-6 space-y-3">
                <textarea value={formData.problem_solution.problem_statement} onChange={(e) => setFormData((p) => ({ ...p, problem_solution: { ...p.problem_solution, problem_statement: e.target.value } }))} rows={4} className={`w-full ${field}`} placeholder="Problem statement" />
                <textarea value={formData.problem_solution.company_description} onChange={(e) => setFormData((p) => ({ ...p, problem_solution: { ...p.problem_solution, company_description: e.target.value } }))} rows={3} className={`w-full ${field}`} placeholder="Company description" />
                <textarea value={formData.problem_solution.solution_description} onChange={(e) => setFormData((p) => ({ ...p, problem_solution: { ...p.problem_solution, solution_description: e.target.value } }))} rows={4} className={`w-full ${field}`} placeholder="Solution description" />
              </div>
            </>
          )}

          {currentStep === 4 && (
            <>
              <h1 className="mt-2 text-3xl font-bold text-white">Traction & Business</h1>
              <div className="mt-7 grid gap-3 md:grid-cols-2">
                <input value={formData.business.customer_segment} onChange={(e) => setFormData((p) => ({ ...p, business: { ...p.business, customer_segment: e.target.value } }))} className={field} placeholder="Customer segment" />
                <input value={formData.business.website} onChange={(e) => setFormData((p) => ({ ...p, business: { ...p.business, website: e.target.value } }))} className={field} placeholder="Website URL" />
                <input value={formData.traction.funding_status} onChange={(e) => setFormData((p) => ({ ...p, traction: { ...p.traction, funding_status: e.target.value } }))} className={field} placeholder="Funding status" />
                <input value={formData.traction.funding_details} onChange={(e) => setFormData((p) => ({ ...p, traction: { ...p.traction, funding_details: e.target.value } }))} className={field} placeholder="Traction details" />
              </div>
            </>
          )}

          {currentStep === 5 && (
            <>
              <h1 className="mt-2 text-3xl font-bold text-white">Preferences & Uploads</h1>
              <div className="mt-6 space-y-3">
                {[0, 1, 2].map((idx) => (
                  <select
                    key={idx}
                    value={formData.preferences.top_3_programs[idx] || defaults[idx]}
                    onChange={(e) =>
                      setFormData((p) => {
                        const next = [...p.preferences.top_3_programs];
                        next[idx] = e.target.value;
                        return { ...p, preferences: { ...p.preferences, top_3_programs: next } };
                      })
                    }
                    className={`w-full ${field}`}
                  >
                    {programs.map((program) => (
                      <option key={`${idx}-${program.id}`} value={program.id} className="bg-[#1a1d26] text-white">
                        {program.name}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
              <div className="mt-3">
                <input type="file" accept=".pdf" onChange={(e) => setDeckFile(e.target.files?.[0] || null)} className="text-xs text-white/50 file:mr-3 file:rounded-md file:border-0 file:bg-[#8B1A1A] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white" />
              </div>
              <input value={formData.assets.video_pitch} onChange={(e) => setFormData((p) => ({ ...p, assets: { ...p.assets, video_pitch: e.target.value } }))} className={`mt-3 w-full ${field}`} placeholder="Video pitch URL" />
              <input value={formData.preferences.expectations} onChange={(e) => setFormData((p) => ({ ...p, preferences: { ...p.preferences, expectations: e.target.value } }))} className={`mt-3 w-full ${field}`} placeholder="Expectations (comma-separated)" />
            </>
          )}

          {message && <p className="mt-4 text-sm text-[#F0997B]">{message}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] bg-black/20 px-5 py-4 md:px-6">
          <button className="text-sm text-white/45 disabled:opacity-30" onClick={prevStep} disabled={currentStep === 1}>
            ← Previous
          </button>
          <span className="text-xs text-white/35">{currentStep} of 5</span>
          <div className="flex flex-wrap items-center gap-2">
            {!submittedAppId && (
              <>
                <button className="rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm text-white/80 hover:border-white/30" onClick={saveDraftNow}>
                  Save Draft
                </button>
                <button className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white/45 hover:text-white/70" onClick={clearDraft}>
                  Clear Draft
                </button>
              </>
            )}
            {submittedAppId ? (
              <>
                <Link href="/dashboard" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 hover:border-white/30">
                  Go to Dashboard
                </Link>
                <button
                  className="rounded-lg bg-[#8B1A1A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a02020]"
                  onClick={() => {
                    setFormData({
                      ...EMPTY_FORM,
                      preferences: { top_3_programs: defaults, expectations: "" },
                    });
                    setDeckFile(null);
                    setSubmittedAppId("");
                    setMessage(null);
                    setCurrentStep(1);
                  }}
                >
                  Start New Application
                </button>
              </>
            ) : currentStep < 5 ? (
              <button className="rounded-lg bg-[#8B1A1A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a02020]" onClick={nextStep}>
                Continue →
              </button>
            ) : (
              <button
                className="rounded-lg bg-[#8B1A1A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a02020] disabled:opacity-60"
                disabled={loading || !!submittedAppId}
                onClick={submitApplication}
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
