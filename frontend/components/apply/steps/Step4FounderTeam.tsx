"use client";

import type { ApplyFormErrors, ApplyFormValues } from "@/lib/applyForm/schema";
import { applyError, applyField, applyLabel } from "../fieldClasses";

type Props = {
  data: ApplyFormValues;
  setData: React.Dispatch<React.SetStateAction<ApplyFormValues>>;
  errors: ApplyFormErrors;
};

export default function Step4FounderTeam({ data, setData, errors }: Props) {
  const e = errors.team ?? {};

  return (
    <>
      <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">Founder & team</h1>
      <div className="mt-8 space-y-5">
        <div>
          <label className={applyLabel}>Number of founders — required</label>
          <input
            value={data.team.foundersCount}
            onChange={(ev) =>
              setData((p) => ({
                ...p,
                team: { ...p.team, foundersCount: ev.target.value.replace(/\D/g, "").slice(0, 3) || "1" },
              }))
            }
            className={`w-full max-w-[200px] ${applyField}`}
            inputMode="numeric"
          />
          {e.foundersCount && <p className={applyError}>{e.foundersCount}</p>}
        </div>
        <div>
          <label className={applyLabel}>Founder backgrounds — min 50 characters</label>
          <textarea
            value={data.team.backgrounds}
            onChange={(ev) => setData((p) => ({ ...p, team: { ...p.team, backgrounds: ev.target.value } }))}
            rows={4}
            className={`w-full ${applyField}`}
            placeholder="Education, work experience, domain expertise…"
          />
          {e.backgrounds && <p className={applyError}>{e.backgrounds}</p>}
        </div>
        <div>
          <label className={applyLabel}>Why are you the right team? — min 50 characters</label>
          <textarea
            value={data.team.whyTeam}
            onChange={(ev) => setData((p) => ({ ...p, team: { ...p.team, whyTeam: ev.target.value } }))}
            rows={4}
            className={`w-full ${applyField}`}
            placeholder="Execution edge, lived experience, complementary skills…"
          />
          {e.whyTeam && <p className={applyError}>{e.whyTeam}</p>}
        </div>
      </div>
    </>
  );
}
