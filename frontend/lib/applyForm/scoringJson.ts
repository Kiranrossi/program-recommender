import type { ApplyFormValues } from "./schema";

/** Clean JSON shape for AI / C2R scoring pipelines (export or log). */
export function toScoringJson(values: ApplyFormValues) {
  return {
    founder: {
      name: values.founder.name,
      email: values.founder.email,
      phone: values.founder.phone,
      linkedin: values.founder.linkedin || "",
    },
    startup: {
      name: values.startup.name,
      website: values.startup.website || "",
      location: values.startup.location,
      city: values.startup.city,
      stage: values.startup.stage,
    },
    problem: values.problem.problem,
    who_faces: values.problem.whoFaces,
    solution: values.problem.solution,
    uniqueness: values.problem.uniqueness,
    traction: {
      revenue: values.traction.revenueInr || "",
      users: values.traction.users || "",
      partnerships: values.traction.partnerships || "",
    },
    team: {
      founders_count: values.team.foundersCount,
      background: values.team.backgrounds,
      why_team: values.team.whyTeam,
    },
    impact: {
      has_impact: values.impact.hasImpact,
      description: values.impact.description || "",
      beneficiaries: values.impact.beneficiaries || "",
    },
    pitch: {
      deck_url: values.pitch.deckUrl,
      video_url: values.pitch.videoUrl || "",
    },
    preferences: values.preferences.orderedIds.map((program_id, i) => ({
      program_id,
      rank: i + 1,
    })),
  };
}
