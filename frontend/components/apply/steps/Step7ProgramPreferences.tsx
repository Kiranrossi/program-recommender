"use client";

import { useMemo } from "react";
import type { Program } from "@/lib/types";
import { buildProgramTags } from "@/lib/programDisplay";
import { recommendProgram } from "@/lib/applyForm/recommend";
import type { ApplyFormErrors, ApplyFormValues } from "@/lib/applyForm/schema";
import { applyError, applyLabel } from "../fieldClasses";

type Props = {
  data: ApplyFormValues;
  setData: React.Dispatch<React.SetStateAction<ApplyFormValues>>;
  errors: ApplyFormErrors;
  programs: Program[];
  onExplorePrograms: () => void;
};

export default function Step7ProgramPreferences({ data, setData, errors, programs, onExplorePrograms }: Props) {
  const e = errors.preferences ?? {};
  const ordered = data.preferences.orderedIds;
  const rec = useMemo(() => recommendProgram(programs, data), [programs, data]);

  function toggle(id: string) {
    setData((p) => {
      const cur = [...p.preferences.orderedIds];
      const ix = cur.indexOf(id);
      if (ix >= 0) {
        cur.splice(ix, 1);
        return { ...p, preferences: { orderedIds: cur } };
      }
      if (cur.length >= 3) return p;
      return { ...p, preferences: { orderedIds: [...cur, id] } };
    });
  }

  function move(idx: number, dir: -1 | 1) {
    setData((p) => {
      const cur = [...p.preferences.orderedIds];
      const j = idx + dir;
      if (j < 0 || j >= cur.length) return p;
      [cur[idx], cur[j]] = [cur[j], cur[idx]];
      return { ...p, preferences: { orderedIds: cur } };
    });
  }

  return (
    <>
      <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">Choose your top 3 programs</h1>
      <p className="mt-2 max-w-xl text-xs leading-relaxed text-white/40">
        Select up to 3 programs based on your startup stage and goals. We&apos;ll also recommend the best fit based on your application. Rank matters:
        #1 is your highest preference.
      </p>

      {rec && (
        <div className="mt-4 rounded-lg border border-[#8B1A1A]/35 bg-[#8B1A1A]/10 px-4 py-3 text-sm text-white/80">
          <span className="text-[#F0997B]">Recommended for you: </span>
          {rec.name}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onExplorePrograms}
          className="rounded-lg border border-white/20 bg-white/[0.06] px-4 py-2 text-xs font-medium text-white hover:border-white/35"
        >
          Explore programs
        </button>
        <span className="self-center text-[11px] text-white/30">You can select up to 3 programs</span>
      </div>

      {e.orderedIds && <p className={`${applyError} mt-3`}>{e.orderedIds}</p>}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => {
          const selected = ordered.includes(program.id);
          const rank = selected ? ordered.indexOf(program.id) + 1 : null;
          const tags = buildProgramTags(program);
          const stage = String(program.criteria?.stage ?? "—");

          return (
            <button
              key={program.id}
              type="button"
              onClick={() => toggle(program.id)}
              className={`flex flex-col rounded-xl border p-4 text-left transition-colors ${
                selected
                  ? "border-[#8B1A1A] bg-[#8B1A1A]/15"
                  : "border-white/[0.09] bg-white/[0.03] hover:border-white/20"
              }`}
            >
              <div className="mb-2 flex flex-wrap gap-1">
                {tags.slice(0, 3).map((t) => (
                  <span key={t.key + t.label} className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${t.className}`}>
                    {t.label}
                  </span>
                ))}
              </div>
              <div className="text-sm font-medium text-white">{program.name}</div>
              <div className="mt-1 text-[10px] text-white/25">Stage: {stage}</div>
              <p className="mt-2 line-clamp-3 text-[11px] leading-snug text-white/40">{program.description ?? ""}</p>
              <div className="mt-3 text-[11px] font-medium text-[#F0997B]">{selected ? `Selected · Rank ${rank}` : "Tap to select"}</div>
            </button>
          );
        })}
      </div>

      {ordered.length > 0 && (
        <div className="mt-8 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className={applyLabel}>Rank your preferences (1 = highest)</div>
          <ol className="mt-3 space-y-2">
            {ordered.map((id, idx) => {
              const p = programs.find((x) => x.id === id);
              return (
                <li key={id} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white/80">
                  <span className="w-6 text-[#F0997B]">{idx + 1}.</span>
                  <span className="min-w-0 flex-1 truncate">{p?.name ?? id}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="rounded border border-white/15 px-2 py-0.5 text-[11px] text-white/50 hover:text-white"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="rounded border border-white/15 px-2 py-0.5 text-[11px] text-white/50 hover:text-white"
                      onClick={() => move(idx, 1)}
                      disabled={idx === ordered.length - 1}
                    >
                      Down
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </>
  );
}
