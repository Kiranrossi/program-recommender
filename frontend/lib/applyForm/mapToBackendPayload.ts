import type { ApplicationCreatePayload } from "@/lib/types";
import type { ApplyFormValues } from "./schema";

/**
 * Maps the wizard shape (aligned with C2R-style JSON) to the current FastAPI ApplicationCreate contract.
 */
export function mapApplyFormToBackendPayload(values: ApplyFormValues): ApplicationCreatePayload {
  const locLine = `${values.startup.city.trim()}, ${values.startup.location}`;
  const stageLower = values.startup.stage.toLowerCase();

  const tractionNotes = [
    values.traction.users?.trim() ? `Users: ${values.traction.users.trim()}` : "",
    values.traction.partnerships?.trim() ? `Partnerships/pilots: ${values.traction.partnerships.trim()}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const revenueNum =
    values.startup.stage !== "Idea" && values.traction.revenueInr?.trim()
      ? Number(values.traction.revenueInr.replace(/,/g, ""))
      : undefined;

  const teamNarrative = `Founders: ${values.team.foundersCount}. Backgrounds: ${values.team.backgrounds.trim()}. Why this team: ${values.team.whyTeam.trim()}`;

  const impactTags: string[] = [];
  if (values.impact.hasImpact) impactTags.push("declared_social_environmental");
  if (values.impact.beneficiaries?.trim()) impactTags.push(`beneficiaries:${values.impact.beneficiaries.trim().slice(0, 80)}`);

  return {
    founder: {
      name: values.founder.name.trim(),
      email: values.founder.email.trim().toLowerCase(),
      phone: values.founder.phone.trim(),
      linkedin: values.founder.linkedin.trim() || null,
      current_location: locLine,
      permanent_location: locLine,
      prior_entrepreneurial_experience: values.team.backgrounds.trim(),
    },
    team: {
      has_cofounder: Number(values.team.foundersCount) > 1,
      cofounders: [],
    },
    startup: {
      name: values.startup.name.trim(),
      stage: stageLower,
      sector: "General",
      team_size: Number(values.team.foundersCount) || 1,
    },
    problem_solution: {
      problem_statement: values.problem.problem.trim(),
      target_customer: values.problem.whoFaces.trim(),
      company_description: values.problem.uniqueness.trim(),
      solution_description: values.problem.solution.trim(),
    },
    business: {
      customer_segment: "",
      market_type: "",
      areas_of_operation: [values.startup.location],
      website: values.startup.website.trim() || null,
      app_link: null,
    },
    traction: {
      estimated_revenue: revenueNum !== undefined && !Number.isNaN(revenueNum) ? revenueNum : null,
      funding_status: stageLower,
      funding_details: tractionNotes || null,
      grants: values.impact.hasImpact ? values.impact.description?.trim() || null : null,
    },
    impact: {
      sdg_alignment: [],
      sector_tags: impactTags,
      social_impact_score: values.impact.hasImpact ? 8 : 5,
    },
    assets: {
      pitch_deck: values.pitch.deckUrl.trim(),
      video_pitch: values.pitch.videoUrl.trim() || null,
      demo_link: null,
    },
    preferences: {
      top_3_programs: values.preferences.orderedIds,
      expectations: [],
    },
    metadata: {
      legal_status: null,
      registered_address: null,
      social_links: [],
      accelerator_history: null,
      nsrcel_history: teamNarrative,
      discovery_source: "universal_apply_wizard_v2",
    },
  };
}
