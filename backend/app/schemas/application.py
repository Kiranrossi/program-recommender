from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator


class FounderSchema(BaseModel):
    name: str
    email: str
    phone: str | None = None
    gender: str | None = None
    dob: str | None = None
    linkedin: HttpUrl | None = None
    education: str | None = None
    graduation_year: int | None = None
    college: str | None = None
    current_location: str
    permanent_location: str
    prior_entrepreneurial_experience: str | None = None
    time_commitment: str | None = None
    role: str | None = None

    @field_validator("linkedin", mode="before")
    @classmethod
    def empty_linkedin_to_none(cls, value):
        if isinstance(value, str) and not value.strip():
            return None
        return value


class CofounderSchema(BaseModel):
    name: str
    email: str | None = None
    role: str | None = None
    education: str | None = None
    linkedin: HttpUrl | None = None
    time_commitment: str | None = None


class TeamSchema(BaseModel):
    has_cofounder: bool = False
    cofounders: list[CofounderSchema] = []


class StartupSchema(BaseModel):
    name: str
    founding_year: int | None = None
    years_in_operation: int | None = None
    industry: str | None = None
    sector: str | None = None
    stage: str | None = None
    tech_type: str | None = None
    operation_type: str | None = None
    team_size: int | None = None


class ProblemSolutionSchema(BaseModel):
    problem_statement: str
    target_customer: str | None = None
    company_description: str | None = None
    solution_description: str | None = None


class BusinessSchema(BaseModel):
    customer_segment: str | None = None
    market_type: str | None = None
    areas_of_operation: list[str] = []
    website: HttpUrl | None = None
    app_link: HttpUrl | None = None

    @field_validator("website", "app_link", mode="before")
    @classmethod
    def empty_urls_to_none(cls, value):
        if isinstance(value, str) and not value.strip():
            return None
        return value


class TractionSchema(BaseModel):
    revenue_current: float | None = None
    revenue_previous: float | None = None
    estimated_revenue: float | None = None
    funding_status: str | None = None
    funding_details: str | None = None
    grants: str | None = None


class ImpactSchema(BaseModel):
    sdg_alignment: list[str] = []
    sector_tags: list[str] = []
    social_impact_score: int | None = Field(default=None, ge=1, le=10)


class AssetsSchema(BaseModel):
    pitch_deck: str | None = None
    video_pitch: str | None = None
    demo_link: str | None = None


class PreferencesSchema(BaseModel):
    top_3_programs: list[UUID]
    expectations: list[str] = []

    @model_validator(mode="after")
    def validate_top_3(self) -> "PreferencesSchema":
        if len(self.top_3_programs) != 3 or len(set(self.top_3_programs)) != 3:
            raise ValueError("top_3_programs must contain exactly three unique program ids.")
        return self


class MetadataSchema(BaseModel):
    legal_status: str | None = None
    registered_address: str | None = None
    social_links: list[str] = []
    accelerator_history: str | None = None
    nsrcel_history: str | None = None
    discovery_source: str | None = None


class ApplicationBase(BaseModel):
    founder: FounderSchema
    team: TeamSchema
    startup: StartupSchema
    problem_solution: ProblemSolutionSchema
    business: BusinessSchema
    traction: TractionSchema
    impact: ImpactSchema
    assets: AssetsSchema
    preferences: PreferencesSchema
    metadata: MetadataSchema


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    founder: FounderSchema | None = None
    team: TeamSchema | None = None
    startup: StartupSchema | None = None
    problem_solution: ProblemSolutionSchema | None = None
    business: BusinessSchema | None = None
    traction: TractionSchema | None = None
    impact: ImpactSchema | None = None
    assets: AssetsSchema | None = None
    preferences: PreferencesSchema | None = None
    metadata: MetadataSchema | None = None


class ApplicationOut(ApplicationBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    status: str
    is_tier2_city: bool
    assigned_program_id: UUID | None = None
    scoring_status: str
    submitted_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class ApplicationStatusOut(BaseModel):
    status: str
    scoring_status: str
    assigned_program: UUID | None
    decision: str | None
