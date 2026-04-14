"use client";

import { STAGES, type ApplyFormErrors, type ApplyFormValues } from "@/lib/applyForm/schema";
import { applyError, applyField, applyLabel } from "../fieldClasses";

type Props = {
  data: ApplyFormValues;
  setData: React.Dispatch<React.SetStateAction<ApplyFormValues>>;
  errors: ApplyFormErrors;
};

export default function Step3TractionStage({ data, setData, errors }: Props) {
  const e = errors.traction ?? {};
  const se = errors.startup ?? {};
  const isIdea = data.startup.stage === "Idea";

  return (
    <>
      <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">Traction & stage</h1>
      <p className="mt-2 text-xs text-white/35">Revenue is optional at Idea stage.</p>

      <div className="mt-8 space-y-5">
        <div>
          <label className={applyLabel}>Startup stage — required</label>
          <select
            value={data.startup.stage}
            onChange={(ev) =>
              setData((p) => ({
                ...p,
                startup: { ...p.startup, stage: ev.target.value as (typeof STAGES)[number] },
              }))
            }
            className={`w-full ${applyField}`}
          >
            {STAGES.map((s) => (
              <option key={s} value={s} className="bg-[#1a1d26]">
                {s}
              </option>
            ))}
          </select>
          {se.stage && <p className={applyError}>{se.stage}</p>}
        </div>
        {!isIdea && (
          <div>
            <label className={applyLabel}>Revenue (INR) — optional</label>
            <input
              value={data.traction.revenueInr}
              onChange={(ev) =>
                setData((p) => ({
                  ...p,
                  traction: { ...p.traction, revenueInr: ev.target.value.replace(/[^\d.,]/g, "") },
                }))
              }
              className={`w-full ${applyField}`}
              placeholder="e.g. 500000"
              inputMode="decimal"
            />
            {e.revenueInr && <p className={applyError}>{e.revenueInr}</p>}
          </div>
        )}
        <div>
          <label className={applyLabel}>Number of users / customers — optional</label>
          <input
            value={data.traction.users}
            onChange={(ev) => setData((p) => ({ ...p, traction: { ...p.traction, users: ev.target.value } }))}
            className={`w-full ${applyField}`}
            placeholder="Approximate count"
          />
        </div>
        <div>
          <label className={applyLabel}>Partnerships / pilots — optional</label>
          <textarea
            value={data.traction.partnerships}
            onChange={(ev) => setData((p) => ({ ...p, traction: { ...p.traction, partnerships: ev.target.value } }))}
            rows={3}
            className={`w-full ${applyField}`}
            placeholder="Named partners, LOIs, pilots…"
          />
        </div>
      </div>
    </>
  );
}
