"use client";

import type { ApplyFormErrors, ApplyFormValues } from "@/lib/applyForm/schema";
import { applyError, applyField, applyLabel } from "../fieldClasses";

type Props = {
  data: ApplyFormValues;
  setData: React.Dispatch<React.SetStateAction<ApplyFormValues>>;
  errors: ApplyFormErrors;
};

export default function Step5SocialImpact({ data, setData, errors }: Props) {
  const e = errors.impact ?? {};

  return (
    <>
      <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">Social impact</h1>
      <p className="mt-2 text-xs text-white/35">This section is important for impact-focused programs.</p>

      <div className="mt-8 space-y-5">
        <div>
          <label className={applyLabel}>Does your startup create social or environmental impact?</label>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setData((p) => ({ ...p, impact: { ...p.impact, hasImpact: true } }))}
              className={`rounded-lg border px-4 py-2 text-sm ${
                data.impact.hasImpact ? "border-[#8B1A1A] bg-[#8B1A1A]/20 text-[#F0997B]" : "border-white/15 text-white/50"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setData((p) => ({ ...p, impact: { ...p.impact, hasImpact: false, description: "", beneficiaries: "" } }))}
              className={`rounded-lg border px-4 py-2 text-sm ${
                !data.impact.hasImpact ? "border-white/40 bg-white/[0.08] text-white" : "border-white/15 text-white/50"
              }`}
            >
              No
            </button>
          </div>
        </div>
        {data.impact.hasImpact && (
          <>
            <div>
              <label className={applyLabel}>Describe the impact — min 50 characters</label>
              <textarea
                value={data.impact.description}
                onChange={(ev) => setData((p) => ({ ...p, impact: { ...p.impact, description: ev.target.value } }))}
                rows={4}
                className={`w-full ${applyField}`}
                placeholder="Outcomes, SDGs, communities served…"
              />
              {e.description && <p className={applyError}>{e.description}</p>}
            </div>
            <div>
              <label className={applyLabel}>Target beneficiaries — optional</label>
              <input
                value={data.impact.beneficiaries}
                onChange={(ev) => setData((p) => ({ ...p, impact: { ...p.impact, beneficiaries: ev.target.value } }))}
                className={`w-full ${applyField}`}
                placeholder="Who benefits and how"
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
