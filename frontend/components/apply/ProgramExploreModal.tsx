"use client";

import type { Program } from "@/lib/types";
import { buildProgramTags, getPartnerLine, getProgramMeta } from "@/lib/programDisplay";

export default function ProgramExploreModal({
  open,
  onClose,
  programs,
}: {
  open: boolean;
  onClose: () => void;
  programs: Program[];
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-[#151821] p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Explore programs</h2>
            <p className="mt-1 text-xs text-white/40">Eligibility and benefits vary by cohort. Use this to choose your top 3 preferences.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/60 hover:border-white/30 hover:text-white"
          >
            Close
          </button>
        </div>
        <ul className="space-y-4">
          {programs.map((program) => {
            const tags = buildProgramTags(program);
            const meta = getProgramMeta(program);
            const crit = program.criteria && typeof program.criteria === "object" ? (program.criteria as Record<string, unknown>) : {};
            const eligibility = typeof crit.eligibility === "string" ? crit.eligibility : null;
            const benefits = typeof crit.benefits === "string" ? crit.benefits : null;

            return (
              <li key={program.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span key={t.key + t.label} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${t.className}`}>
                      {t.label}
                    </span>
                  ))}
                </div>
                <h3 className="text-sm font-medium text-white">{program.name}</h3>
                <p className="mt-0.5 text-[11px] text-white/35">{getPartnerLine(program)}</p>
                <p className="mt-2 text-xs leading-relaxed text-white/45">{program.description ?? "Details coming soon."}</p>
                {meta.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-4 border-t border-white/[0.06] pt-3">
                    {meta.map((m) => (
                      <div key={m.label}>
                        <div className="text-[10px] text-white/25">{m.label}</div>
                        <div className="text-[11px] text-white/55">{m.val}</div>
                      </div>
                    ))}
                  </div>
                )}
                {eligibility && (
                  <p className="mt-2 text-[11px] text-white/40">
                    <span className="text-white/55">Eligibility: </span>
                    {eligibility}
                  </p>
                )}
                {benefits && (
                  <p className="mt-1 text-[11px] text-white/40">
                    <span className="text-white/55">Benefits: </span>
                    {benefits}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
