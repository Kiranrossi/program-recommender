import type { Program } from "@/lib/types";
import { buildProgramTags } from "@/lib/programDisplay";
import type { ApplyFormValues } from "./schema";

/** Lightweight recommendation from stage + impact (no ML). */
export function recommendProgram(programs: Program[], values: ApplyFormValues): Program | null {
  if (!programs.length) return null;
  const stage = values.startup.stage.toLowerCase();
  const wantSocial = values.impact.hasImpact;

  const scored = programs.map((p) => {
    let score = 0;
    const pStage = String(p.criteria?.stage ?? "").toLowerCase();
    const tags = buildProgramTags(p);
    if (stage === "idea" && pStage === "idea") score += 3;
    if (stage === "growth" && pStage === "growth") score += 3;
    if (stage === "mvp" || stage === "early revenue") score += pStage === "idea" || pStage === "growth" ? 2 : 0;
    if (wantSocial && tags.some((t) => t.key === "social")) score += 2;
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.p ?? programs[0];
}
