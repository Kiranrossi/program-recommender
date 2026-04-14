export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: string;
};

export type Program = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  criteria: Record<string, unknown>;
  is_active: boolean;
  application_deadline: string | null;
  max_intake: number | null;
};

export type ApplicationExplainability = {
  top_program_selected: {
    program_id: string;
    program_name: string;
    final_score: string | null;
  } | null;
  top_3_scores: Array<{
    program_id: string;
    program_name: string;
    program_score: string | null;
    preference_score: string | null;
    final_score: string | null;
  }>;
  reason: string[];
};

export type ApplicationStatus = {
  status: string;
  scoring_status: string;
  assigned_program: string | null;
  decision: string | null;
  explainability?: ApplicationExplainability;
};

export type ApplicantApplication = {
  id: string;
  founder_name: string;
  startup_name: string;
  status: string;
  scoring_status: string;
  submitted_at: string | null;
  pitch_deck_url: string | null;
  video_pitch_url: string | null;
  preference_1: string;
  preference_2: string;
  preference_3: string;
  assigned_program_id: string | null;
};

export type EvaluationResult = {
  applicant_id: string;
  program_scores: Record<string, number>;
  top_3_programs: string[];
  final_program: string;
  confidence: number;
  reasoning: string;
};

export type ProgramOption = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  criteria?: Record<string, unknown>;
  required_fields?: string[];
  scoring_weights?: {
    stage_fit: number;
    sector_fit: number;
    traction: number;
    social_impact: number;
    geography: number;
  };
};

export type ApplicationCreatePayload = {
  founder: Record<string, unknown>;
  team: Record<string, unknown>;
  startup: Record<string, unknown>;
  problem_solution: Record<string, unknown>;
  business: Record<string, unknown>;
  traction: Record<string, unknown>;
  impact: Record<string, unknown>;
  assets: Record<string, unknown>;
  preferences: { top_3_programs: string[]; expectations: string[] };
  metadata: Record<string, unknown>;
};

export type ApplicationCreateResult = {
  id: string;
  status: string;
  submitted_at: string;
};

export type AdminApplication = {
  id: string;
  founder_name: string;
  startup_name: string;
  city: string;
  stage?: string | null;
  sector?: string | null;
  is_tier2_city: boolean;
  status: string;
  scoring_status: string;
  max_final_score?: number | null;
  submitted_at: string | null;
};

export type PaginatedApplications = {
  items: AdminApplication[];
  total: number;
  page: number;
  limit: number;
};

export type DecisionPayload = {
  outcome: "offered" | "rejected";
  rejection_reason?: string;
};

export type ApplicationScoreRow = {
  id: string;
  program_id: string;
  total_score: string | number | null;
  program_fit_score: string | number | null;
  preference_score?: string | number | null;
  final_score?: string | number | null;
  ai_reasoning: string | null;
  explainability_summary?: string | null;
  score_breakdown?: Record<string, string> | null;
  feature_snapshot?: Record<string, unknown> | null;
  score_social_impact: string | number | null;
  score_team_strength: string | number | null;
};

export type HitlReviewRow = {
  id: string;
  qualitative_notes: string | null;
  verdict: string | null;
  reviewed_at: string | null;
};

export type AdminApplicationDetail = {
  application: AdminApplication & {
    assigned_program_id: string | null;
    pitch_deck_url: string | null;
    video_pitch_url: string | null;
    problem_statement: string | null;
    solution_description: string | null;
  };
  scores: ApplicationScoreRow[];
  hitl_reviews: HitlReviewRow[];
  decision: { outcome: string } | null;
};

export type SimulationResult = {
  applications: Array<{
    application: {
      startup_name: string;
      founder_name: string;
      stage: string;
      sector: string;
      city: string;
    };
    matched_program_id: string;
    matched_program_name: string;
    top_3_scores: Array<{
      program_id: string;
      program_name: string;
      program_score: number;
      preference_score: number;
      final_score: number;
    }>;
    explanation: string;
  }>;
  programs: Array<{ id: string; name: string }>;
};
