import type { ApplyFormValues } from "./schema";

export const EMPTY_APPLY_FORM: ApplyFormValues = {
  founder: { name: "", email: "", phone: "", linkedin: "" },
  startup: { name: "", website: "", location: "", city: "", stage: "Idea" },
  problem: { problem: "", whoFaces: "", solution: "", uniqueness: "" },
  traction: { revenueInr: "", users: "", partnerships: "" },
  team: { foundersCount: "1", backgrounds: "", whyTeam: "" },
  impact: { hasImpact: false, description: "", beneficiaries: "" },
  pitch: { deckUrl: "", videoUrl: "" },
  preferences: { orderedIds: [] },
};

export const DRAFT_KEY_V2 = "nsrcel_universal_apply_draft_v2";
