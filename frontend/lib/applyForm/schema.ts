import { z } from "zod";

const httpUrl = z
  .string()
  .min(1, "Required")
  .refine((s) => /^https?:\/\/.+/i.test(s.trim()), "Must start with http:// or https://");

const optionalHttpUrl = z
  .string()
  .optional()
  .transform((s) => (s ?? "").trim())
  .refine((s) => s === "" || /^https?:\/\/.+/i.test(s), "Must start with http:// or https://");

export const LOCATIONS = [
  "Bangalore / Karnataka",
  "Delhi NCR",
  "Mumbai / Maharashtra",
  "Hyderabad / Telangana",
  "Chennai / Tamil Nadu",
  "Kolkata / West Bengal",
  "Tier-2 / Tier-3 city",
  "Other",
] as const;

export const STAGES = ["Idea", "MVP", "Early Revenue", "Growth"] as const;

export const applyFormSchema = z.object({
  founder: z.object({
    name: z.string().min(1, "Full name is required"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().regex(/^\d{10,15}$/, "Phone must be 10–15 digits (numbers only)"),
    linkedin: optionalHttpUrl,
  }),
  startup: z.object({
    name: z.string().min(1, "Startup name is required"),
    website: optionalHttpUrl,
    location: z.string().min(1, "Choose a location"),
    city: z.string().min(1, "City is required"),
    stage: z.enum(STAGES),
  }),
  problem: z.object({
    problem: z.string().min(100, "Please enter at least 100 characters").max(500, "Maximum 500 characters"),
    whoFaces: z.string().min(50, "Please enter at least 50 characters"),
    solution: z.string().min(100, "Please enter at least 100 characters").max(500, "Maximum 500 characters"),
    uniqueness: z.string().min(50, "Please enter at least 50 characters"),
  }),
  traction: z.object({
    revenueInr: z.string().optional(),
    users: z.string().optional(),
    partnerships: z.string().optional(),
  }),
  team: z.object({
    foundersCount: z
      .string()
      .min(1, "Required")
      .refine((s) => /^\d+$/.test(s) && Number(s) >= 1, "Enter a positive number"),
    backgrounds: z.string().min(50, "Please enter at least 50 characters"),
    whyTeam: z.string().min(50, "Please enter at least 50 characters"),
  }),
  impact: z.object({
    hasImpact: z.boolean(),
    description: z.string().optional(),
    beneficiaries: z.string().optional(),
  }),
  pitch: z.object({
    deckUrl: httpUrl,
    videoUrl: optionalHttpUrl,
  }),
  preferences: z.object({
    /** program ids in preference order: index 0 = rank 1 */
    orderedIds: z
      .array(z.string().uuid())
      .length(3, "Select and rank exactly 3 programs")
      .refine((ids) => new Set(ids).size === 3, "Programs must be unique"),
 }),
});

export type ApplyFormValues = z.infer<typeof applyFormSchema>;

export type ApplyFormErrors = Partial<{
  [K in keyof ApplyFormValues]: Partial<Record<string, string>>;
}>;

function impactRefined(data: ApplyFormValues): boolean {
  if (!data.impact.hasImpact) return true;
  return !!(data.impact.description && data.impact.description.length >= 50);
}

export function validateFullForm(data: ApplyFormValues): ApplyFormErrors {
  const errors: ApplyFormErrors = {};
  const base = applyFormSchema.safeParse(data);
  if (!base.success) {
    for (const issue of base.error.issues) {
      const path = issue.path;
      if (path[0] === "founder" && path[1]) {
        errors.founder = { ...errors.founder, [path[1] as string]: issue.message };
      } else if (path[0] === "startup" && path[1]) {
        errors.startup = { ...errors.startup, [path[1] as string]: issue.message };
      } else if (path[0] === "problem" && path[1]) {
        errors.problem = { ...errors.problem, [path[1] as string]: issue.message };
      } else if (path[0] === "traction" && path[1]) {
        errors.traction = { ...errors.traction, [path[1] as string]: issue.message };
      } else if (path[0] === "team" && path[1]) {
        errors.team = { ...errors.team, [path[1] as string]: issue.message };
      } else if (path[0] === "impact" && path[1]) {
        errors.impact = { ...errors.impact, [path[1] as string]: issue.message };
      } else if (path[0] === "pitch" && path[1]) {
        errors.pitch = { ...errors.pitch, [path[1] as string]: issue.message };
      } else if (path[0] === "preferences") {
        errors.preferences = { ...errors.preferences, orderedIds: issue.message };
      }
    }
  }
  if (data.impact.hasImpact && !impactRefined(data)) {
    errors.impact = { ...errors.impact, description: "Please enter at least 50 characters" };
  }
  return errors;
}

export function validateStep(step: number, data: ApplyFormValues): ApplyFormErrors {
  const slice = (() => {
    switch (step) {
      case 1:
        return applyFormSchema.pick({ founder: true, startup: true }).safeParse(data);
      case 2:
        return applyFormSchema.pick({ problem: true }).safeParse(data);
      case 3:
        return applyFormSchema.pick({ traction: true, startup: true }).safeParse(data);
      case 4:
        return applyFormSchema.pick({ team: true }).safeParse(data);
      case 5:
        return applyFormSchema.pick({ impact: true }).safeParse(data);
      case 6:
        return applyFormSchema.pick({ pitch: true }).safeParse(data);
      case 7:
        return applyFormSchema.pick({ preferences: true }).safeParse(data);
      default:
        return { success: true as const };
    }
  })();

  if (slice.success) {
    if (step === 5 && !impactRefined(data)) {
      return { impact: { description: "Please enter at least 50 characters" } };
    }
    return {};
  }

  const errors: ApplyFormErrors = {};
  for (const issue of slice.error.issues) {
    const path = issue.path;
    if (path[0] === "founder" && path[1]) {
      errors.founder = { ...errors.founder, [path[1] as string]: issue.message };
    } else if (path[0] === "startup" && path[1]) {
      errors.startup = { ...errors.startup, [path[1] as string]: issue.message };
    } else if (path[0] === "problem" && path[1]) {
      errors.problem = { ...errors.problem, [path[1] as string]: issue.message };
    } else if (path[0] === "traction" && path[1]) {
      errors.traction = { ...errors.traction, [path[1] as string]: issue.message };
    } else if (path[0] === "team" && path[1]) {
      errors.team = { ...errors.team, [path[1] as string]: issue.message };
    } else if (path[0] === "impact" && path[1]) {
      errors.impact = { ...errors.impact, [path[1] as string]: issue.message };
    } else if (path[0] === "pitch" && path[1]) {
      errors.pitch = { ...errors.pitch, [path[1] as string]: issue.message };
    } else if (path[0] === "preferences") {
      errors.preferences = { ...errors.preferences, orderedIds: issue.message };
    }
  }
  return errors;
}

/** Heuristic “generic answer” hint for text fields */
export function genericAnswerHint(text: string, minWords = 35): string | null {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (text.length > 280 && words.length >= minWords) return null;
  const generic = /\b(we are|our startup|innovative|unique|best|leading|game.?changer|synergy|passionate)\b/i;
  if (words.length < 25 || generic.test(text)) {
    return "Your answer may be too generic — add specifics (who, what, metrics, why now).";
  }
  return null;
}
