"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createApplication, fetchPrograms, fetchProgramOptions, programOptionsToPrograms } from "@/lib/api";
import { EMPTY_APPLY_FORM, DRAFT_KEY_V2 } from "@/lib/applyForm/defaults";
import { mapApplyFormToBackendPayload } from "@/lib/applyForm/mapToBackendPayload";
import { validateFullForm, validateStep, type ApplyFormErrors, type ApplyFormValues } from "@/lib/applyForm/schema";
import type { Program } from "@/lib/types";
import BackToHome from "@/components/BackToHome";
import ProgramExploreModal from "./ProgramExploreModal";
import Step1FounderStartup from "./steps/Step1FounderStartup";
import Step2ProblemSolution from "./steps/Step2ProblemSolution";
import Step3TractionStage from "./steps/Step3TractionStage";
import Step4FounderTeam from "./steps/Step4FounderTeam";
import Step5SocialImpact from "./steps/Step5SocialImpact";
import Step6PitchMaterials from "./steps/Step6PitchMaterials";
import Step7ProgramPreferences from "./steps/Step7ProgramPreferences";
import Step8Summary from "./steps/Step8Summary";

const STEP_LABELS = [
  "Basics",
  "Problem",
  "Traction",
  "Team",
  "Impact",
  "Pitch",
  "Programs",
  "Review",
];

function hasErrors(e: ApplyFormErrors): boolean {
  for (const v of Object.values(e)) {
    if (v && typeof v === "object" && Object.keys(v).length > 0) return true;
  }
  return false;
}

export default function ApplyWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ApplyFormValues>(EMPTY_APPLY_FORM);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programsError, setProgramsError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ApplyFormErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submittedId, setSubmittedId] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");

  useEffect(() => {
    let cancelled = false;
    setProgramsError(null);
    (async () => {
      try {
        const opts = await fetchProgramOptions();
        if (!cancelled) setPrograms(programOptionsToPrograms(opts));
      } catch {
        try {
          const list = await fetchPrograms();
          if (!cancelled) setPrograms(list);
        } catch (e) {
          if (!cancelled) {
            const detail = e instanceof Error ? e.message : "Request failed.";
            setProgramsError(
              `${detail} If you run locally, start the backend (uvicorn on port 8000) and set BACKEND_ORIGIN in frontend/.env.local to match.`
            );
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY_V2);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { data: ApplyFormValues; step: number };
      if (parsed.data) setData(parsed.data);
      if (parsed.step >= 1 && parsed.step <= 8) setStep(parsed.step);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY_V2, JSON.stringify({ data, step }));
    setLastSavedAt(new Date().toLocaleTimeString());
  }, [data, step]);

  function goNext() {
    const v = validateStep(step, data);
    setErrors(v);
    if (hasErrors(v)) {
      setMessage("Please fix the errors below before continuing.");
      return;
    }
    setErrors({});
    setMessage(null);
    setStep((s) => Math.min(8, s + 1));
  }

  function goPrev() {
    setErrors({});
    setMessage(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function submit() {
    const v = validateFullForm(data);
    setErrors(v);
    if (hasErrors(v)) {
      setMessage("Some fields are still invalid. Review the steps marked in Review or go back.");
      return;
    }
    if (submittedId) return;
    setLoading(true);
    setMessage(null);
    try {
      const payload = mapApplyFormToBackendPayload(data);
      const result = await createApplication(payload);
      localStorage.setItem("nsrcel_application_id", result.id);
      localStorage.removeItem(DRAFT_KEY_V2);
      setSubmittedId(result.id);
      setMessage(`Submitted successfully. Application ID: ${result.id}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setLoading(false);
    }
  }

  function saveDraftNow() {
    localStorage.setItem(DRAFT_KEY_V2, JSON.stringify({ data, step }));
    setLastSavedAt(new Date().toLocaleTimeString());
    setMessage("Draft saved in this browser.");
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY_V2);
    setData(EMPTY_APPLY_FORM);
    setStep(1);
    setMessage("Draft cleared.");
  }

  return (
    <main className="min-h-screen bg-[#0f1117] px-4 py-8 text-white md:px-8">
      <div className="mb-4">
        <BackToHome />
      </div>

      <section className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] px-5 py-4 md:px-6">
          <div>
            <div className="text-sm font-semibold text-white">NSRCEL · Universal application</div>
            <div className="text-xs text-white/35">Auto-saved {lastSavedAt ? `at ${lastSavedAt}` : ""}</div>
            <div className="mt-1 text-[11px] text-white/25">
              Sign in is required to submit.{" "}
              <Link href="/sign-in" className="text-[#F0997B] hover:underline">
                Sign in
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STEP_LABELS.map((label, i) => (
              <span
                key={label}
                className={`rounded-full border px-2.5 py-1 text-[10px] ${
                  i + 1 < step
                    ? "border-[#8B1A1A] bg-[#8B1A1A] text-white"
                    : i + 1 === step
                      ? "border-[#8B1A1A] bg-[#8B1A1A]/15 text-[#F0997B]"
                      : "border-white/10 text-white/40"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="h-1 w-full bg-white/[0.06]">
          <div className="h-1 bg-[#8B1A1A] transition-all" style={{ width: `${(step / 8) * 100}%` }} />
        </div>

        <div className="mx-auto max-w-3xl px-5 py-10 md:px-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#F0997B]">
            Step {step} of {STEP_LABELS.length}
          </p>

          {step === 1 && <Step1FounderStartup data={data} setData={setData} errors={errors} />}
          {step === 2 && <Step2ProblemSolution data={data} setData={setData} errors={errors} />}
          {step === 3 && <Step3TractionStage data={data} setData={setData} errors={errors} />}
          {step === 4 && <Step4FounderTeam data={data} setData={setData} errors={errors} />}
          {step === 5 && <Step5SocialImpact data={data} setData={setData} errors={errors} />}
          {step === 6 && <Step6PitchMaterials data={data} setData={setData} errors={errors} />}
          {step === 7 && (
            <Step7ProgramPreferences
              data={data}
              setData={setData}
              errors={errors}
              programs={programs}
              onExplorePrograms={() => setExploreOpen(true)}
            />
          )}
          {step === 8 && <Step8Summary data={data} programs={programs} />}

          {programsError && step === 7 && <p className="mt-4 text-sm text-[#F0997B]">{programsError}</p>}
          {message && <p className="mt-4 text-sm text-[#F0997B]">{message}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] bg-black/20 px-5 py-4 md:px-6">
          <button type="button" className="text-sm text-white/45 disabled:opacity-30" onClick={goPrev} disabled={step === 1 || !!submittedId}>
            ← Previous
          </button>
          <span className="text-xs text-white/35">
            {step} / {STEP_LABELS.length}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {!submittedId && (
              <>
                <button
                  type="button"
                  className="rounded-lg border border-white/15 bg-transparent px-3 py-2 text-sm text-white/80 hover:border-white/30"
                  onClick={saveDraftNow}
                >
                  Save draft
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white/45 hover:text-white/70"
                  onClick={clearDraft}
                >
                  Clear draft
                </button>
              </>
            )}
            {submittedId ? (
              <>
                <Link href="/dashboard" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 hover:border-white/30">
                  Go to dashboard
                </Link>
                <Link href="/programs" className="rounded-lg bg-[#8B1A1A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a02020]">
                  Explore programs
                </Link>
              </>
            ) : step < 8 ? (
              <button type="button" className="rounded-lg bg-[#8B1A1A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a02020]" onClick={goNext}>
                Continue →
              </button>
            ) : (
              <button
                type="button"
                className="rounded-lg bg-[#8B1A1A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a02020] disabled:opacity-60"
                disabled={loading}
                onClick={submit}
              >
                {loading ? "Submitting…" : "Submit application"}
              </button>
            )}
          </div>
        </div>
      </section>

      <ProgramExploreModal open={exploreOpen} onClose={() => setExploreOpen(false)} programs={programs} />
    </main>
  );
}
