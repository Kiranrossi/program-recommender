"use client";

import { useState } from "react";
import type { ApplyFormValues } from "@/lib/applyForm/schema";
import { toScoringJson } from "@/lib/applyForm/scoringJson";
import type { Program } from "@/lib/types";

type Props = {
  data: ApplyFormValues;
  programs: Program[];
};

export default function Step8Summary({ data, programs }: Props) {
  const [copied, setCopied] = useState(false);
  const json = toScoringJson(data);
  const names = data.preferences.orderedIds.map((id, i) => {
    const p = programs.find((x) => x.id === id);
    return `${i + 1}. ${p?.name ?? id}`;
  });

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(json, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // no-op
    }
  }

  return (
    <>
      <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">Review & submit</h1>
      <p className="mt-3 text-sm leading-relaxed text-white/45">
        Your application will be evaluated across programs using an automated scoring system, with human review before final decisions.
      </p>

      <div className="mt-8 space-y-4 text-sm">
        <SummaryBlock title="Founder" lines={[data.founder.name, data.founder.email, data.founder.phone]} />
        <SummaryBlock title="Startup" lines={[data.startup.name, `${data.startup.city}, ${data.startup.location}`, `Stage: ${data.startup.stage}`]} />
        <SummaryBlock title="Problem (excerpt)" lines={[data.problem.problem.slice(0, 160) + (data.problem.problem.length > 160 ? "…" : "")]} />
        <SummaryBlock title="Program preferences" lines={names} />
      </div>

      <div className="mt-8 rounded-xl border border-white/10 bg-black/25 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-white/35">Structured JSON (for scoring / export)</span>
          <button
            type="button"
            onClick={copyJson}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-[11px] text-white/70 hover:border-white/30"
          >
            {copied ? "Copied" : "Copy JSON"}
          </button>
        </div>
        <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-black/40 p-3 text-[10px] leading-relaxed text-white/50">{JSON.stringify(json, null, 2)}</pre>
      </div>
    </>
  );
}

function SummaryBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#F0997B]">{title}</div>
      <ul className="mt-2 space-y-1 text-white/55">
        {lines.filter(Boolean).map((line, i) => (
          <li key={`${title}-${i}`} className="text-xs leading-snug">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
