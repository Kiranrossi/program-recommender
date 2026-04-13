import type { Program } from "./types";

export type ProgramFilter = "all" | "idea" | "growth" | "women" | "social" | "students";

export type DisplayTag = { key: string; label: string; className: string };

const TAG_STYLES = {
  idea: "bg-[rgba(29,158,117,0.14)] text-[#5DCAA5] border-[0.5px] border-[rgba(29,158,117,0.25)]",
  growth: "bg-[rgba(55,138,221,0.12)] text-[#85B7EB] border-[0.5px] border-[rgba(55,138,221,0.2)]",
  social: "bg-[rgba(139,26,26,0.18)] text-[#F0997B] border-[0.5px] border-[rgba(139,26,26,0.3)]",
  women: "bg-[rgba(212,83,126,0.13)] text-[#ED93B1] border-[0.5px] border-[rgba(212,83,126,0.2)]",
  student: "bg-[rgba(127,119,221,0.13)] text-[#AFA9EC] border-[0.5px] border-[rgba(127,119,221,0.2)]",
  mobility: "bg-[rgba(186,117,23,0.13)] text-[#FAC775] border-[0.5px] border-[rgba(186,117,23,0.2)]",
};

export function buildProgramTags(program: Program): DisplayTag[] {
  const slug = program.slug.toLowerCase();
  const name = program.name.toLowerCase();
  const stage = String(program.criteria?.stage ?? "").toLowerCase();
  const tags: DisplayTag[] = [];
  if (stage === "idea") tags.push({ key: "idea", label: "Idea stage", className: TAG_STYLES.idea });
  if (stage === "growth") tags.push({ key: "growth", label: "Growth stage", className: TAG_STYLES.growth });
  if (name.includes("women") || slug.includes("women")) tags.push({ key: "women", label: "Women-led", className: TAG_STYLES.women });
  if (slug.includes("campus") || name.includes("campus")) tags.push({ key: "student", label: "Students", className: TAG_STYLES.student });
  if (
    slug.includes("impact-orbit") ||
    slug.includes("swavalambane") ||
    slug.includes("circular-economy")
  ) {
    tags.push({ key: "social", label: "Social impact", className: TAG_STYLES.social });
  }
  if (slug.includes("mobility") || name.includes("mobility")) {
    tags.push({ key: "mobility", label: "Mobility", className: TAG_STYLES.mobility });
  }
  return tags;
}

export function programMatchesFilter(program: Program, filter: ProgramFilter, tagList: DisplayTag[]): boolean {
  const stage = String(program.criteria?.stage ?? "").toLowerCase();
  switch (filter) {
    case "all":
      return true;
    case "idea":
      return stage === "idea";
    case "growth":
      return stage === "growth";
    case "women":
      return tagList.some((t) => t.key === "women");
    case "social":
      return tagList.some((t) => t.key === "social");
    case "students":
      return tagList.some((t) => t.key === "student");
    default:
      return true;
  }
}

const PARTNER_BY_SLUG: Record<string, string> = {
  launchpad: "NSRCEL flagship",
  "women-startup-program": "CSR · Kotak Mahindra Bank",
  "campus-founders": "Supported by GPS Renewables",
  "healthcare-incubation-program": "CSR · DailyRounds",
  "goldman-sachs-10000-women": "Goldman Sachs · Fully sponsored",
  "goldman-sachs-finance-for-growth": "Goldman Sachs",
  "impact-orbit-tech-enabled-social-innovations": "Tech-enabled social innovations",
  "sustainable-mobility-incubation-program": "Climate tech · EV focus",
  "circular-economy-incubation-program": "Sustainability focus",
  "emerging-consumer-brands": "D2C · FMCG · Retail",
  swavalambane: "Grassroots entrepreneurship",
  velocity: "Scale-up track",
};

export function getPartnerLine(program: Program): string {
  return PARTNER_BY_SLUG[program.slug] ?? "NSRCEL program";
}

type MetaRow = { label: string; val: string };

const META_OVERRIDES: Record<string, MetaRow[]> = {
  launchpad: [
    { label: "Duration", val: "2 months" },
    { label: "Intake", val: "~30 / cohort" },
    { label: "Fee", val: "None" },
  ],
  "women-startup-program": [
    { label: "Stage", val: "Idea → MVP" },
    { label: "Alumni", val: "274+ founders" },
  ],
  "healthcare-incubation-program": [
    { label: "Focus", val: "Med-tech" },
    { label: "Fee", val: "None" },
  ],
  "campus-founders": [
    { label: "Duration", val: "4 months" },
    { label: "Eligibility", val: "Students only" },
  ],
  "goldman-sachs-10000-women": [
    { label: "Stage", val: "Revenue+" },
    { label: "Fee", val: "Fully free" },
  ],
  "goldman-sachs-finance-for-growth": [
    { label: "Format", val: "3 modules" },
    { label: "Focus", val: "Fundraising" },
  ],
  "impact-orbit-tech-enabled-social-innovations": [
    { label: "Stage", val: "Pre-revenue+" },
    { label: "Equity", val: "None taken" },
  ],
  "sustainable-mobility-incubation-program": [
    { label: "Sector", val: "CleanTech" },
    { label: "Stage", val: "MVP+" },
  ],
  "circular-economy-incubation-program": [
    { label: "Focus", val: "Circular / waste" },
    { label: "Fee", val: "None" },
  ],
  "emerging-consumer-brands": [
    { label: "Sector", val: "D2C / FMCG" },
    { label: "Stage", val: "Revenue+" },
  ],
  swavalambane: [
    { label: "Focus", val: "Grassroots" },
    { label: "Tier 2/3", val: "Priority" },
  ],
  velocity: [
    { label: "Stage", val: "Series A ready" },
    { label: "Format", val: "Intensive" },
  ],
};

export function getProgramMeta(program: Program): MetaRow[] {
  const override = META_OVERRIDES[program.slug];
  if (override) {
    return override.map((row) =>
      row.label === "Intake" && program.max_intake != null ? { ...row, val: `~${program.max_intake} / cohort` } : row
    );
  }
  const stage = String(program.criteria?.stage ?? "").toLowerCase();
  const intake = program.max_intake != null ? `~${program.max_intake} / cohort` : "—";
  const rows: MetaRow[] = [
    { label: "Stage", val: stage === "growth" ? "Growth" : "Idea" },
    { label: "Intake", val: intake },
  ];
  if (program.application_deadline) {
    rows.push({ label: "Apply by", val: new Date(program.application_deadline).toLocaleDateString() });
  }
  return rows.slice(0, 3);
}

export function isFeaturedProgram(program: Program): boolean {
  return program.slug === "launchpad";
}
