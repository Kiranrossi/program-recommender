"use client";

import { genericAnswerHint, type ApplyFormErrors, type ApplyFormValues } from "@/lib/applyForm/schema";
import { applyError, applyField, applyHint, applyLabel } from "../fieldClasses";

type Props = {
  data: ApplyFormValues;
  setData: React.Dispatch<React.SetStateAction<ApplyFormValues>>;
  errors: ApplyFormErrors;
};

function CharCount({ cur, max }: { cur: number; max: number }) {
  return (
    <span className="text-[10px] text-white/25">
      {cur} / {max}
    </span>
  );
}

export default function Step2ProblemSolution({ data, setData, errors }: Props) {
  const e = errors.problem ?? {};
  const p = data.problem;

  return (
    <>
      <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">Problem & solution</h1>
      <p className="mt-2 text-xs text-white/35">Be specific. Avoid generic answers.</p>

      <div className="mt-8 space-y-6">
        <div>
          <div className="mb-1 flex justify-between">
            <label className={applyLabel.replace("mb-1 ", "")}>What problem are you solving? — min 100 chars</label>
            <CharCount cur={p.problem.length} max={500} />
          </div>
          <textarea
            value={p.problem}
            onChange={(ev) => setData((prev) => ({ ...prev, problem: { ...prev.problem, problem: ev.target.value } }))}
            rows={5}
            className={`w-full ${applyField}`}
            placeholder="Describe the problem clearly…"
          />
          {e.problem && <p className={applyError}>{e.problem}</p>}
          {genericAnswerHint(p.problem) && <p className={applyHint}>Tip: {genericAnswerHint(p.problem)}</p>}
        </div>
        <div>
          <div className="mb-1 flex justify-between">
            <label className={applyLabel.replace("mb-1 ", "")}>Who faces this problem? — min 50 chars</label>
            <span className="text-[10px] text-white/25">{p.whoFaces.length}+</span>
          </div>
          <textarea
            value={p.whoFaces}
            onChange={(ev) => setData((prev) => ({ ...prev, problem: { ...prev.problem, whoFaces: ev.target.value } }))}
            rows={3}
            className={`w-full ${applyField}`}
            placeholder="Customer segment, geography, urgency…"
          />
          {e.whoFaces && <p className={applyError}>{e.whoFaces}</p>}
        </div>
        <div>
          <div className="mb-1 flex justify-between">
            <label className={applyLabel.replace("mb-1 ", "")}>Describe your solution — min 100 chars</label>
            <CharCount cur={p.solution.length} max={500} />
          </div>
          <textarea
            value={p.solution}
            onChange={(ev) => setData((prev) => ({ ...prev, problem: { ...prev.problem, solution: ev.target.value } }))}
            rows={5}
            className={`w-full ${applyField}`}
            placeholder="How you solve it today…"
          />
          {e.solution && <p className={applyError}>{e.solution}</p>}
          {genericAnswerHint(p.solution) && <p className={applyHint}>Tip: {genericAnswerHint(p.solution)}</p>}
        </div>
        <div>
          <div className="mb-1 flex justify-between">
            <label className={applyLabel.replace("mb-1 ", "")}>What makes your solution unique? — min 50 chars</label>
            <span className="text-[10px] text-white/25">{p.uniqueness.length}+</span>
          </div>
          <textarea
            value={p.uniqueness}
            onChange={(ev) => setData((prev) => ({ ...prev, problem: { ...prev.problem, uniqueness: ev.target.value } }))}
            rows={3}
            className={`w-full ${applyField}`}
            placeholder="Moat, insight, distribution…"
          />
          {e.uniqueness && <p className={applyError}>{e.uniqueness}</p>}
        </div>
      </div>
    </>
  );
}
