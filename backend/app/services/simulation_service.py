import random
import uuid
from types import SimpleNamespace

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.explanation_agent import ExplanationAgent
from app.agents.feature_extraction_agent import FeatureExtractionAgent
from app.agents.matching_agent import MatchingAgent
from app.agents.scoring_agent import ScoringAgent
from app.models.program import Program
from app.services.program_config_service import ensure_program_configs

STAGES = ["idea", "mvp", "revenue", "growth"]
SECTORS = ["healthcare", "fintech", "edtech", "agritech", "deeptech", "consumer", "social"]
CITIES = ["Bengaluru", "Mysuru", "Hubli", "Belagavi", "Tumakuru", "Rural Mandya"]

PROBLEMS = [
    "Limited healthcare access in underserved towns.",
    "Farmers lack demand forecasting and market intelligence.",
    "Students in tier-2 cities have low mentorship access.",
    "MSMEs face credit scoring and financing constraints.",
]

SOLUTIONS = [
    "AI assistant with analytics and workflow automation for operators.",
    "Digital platform connecting stakeholders with predictive insights.",
    "Data-driven mobile-first tools for adoption and measurable outcomes.",
    "Community-led model with SaaS dashboard and realtime reporting.",
]


def _dummy_application(seed: int, preference_ids: list) -> SimpleNamespace:
    random.seed(seed)
    prefs = random.sample(preference_ids, k=min(3, len(preference_ids)))
    while len(prefs) < 3:
        prefs.append(preference_ids[0])
    return SimpleNamespace(
        id=uuid.uuid4(),
        startup_name=f"SimStartup-{seed}",
        founder_name=f"Founder-{seed}",
        city=random.choice(CITIES),
        state="Karnataka",
        stage=random.choice(STAGES),
        sector=random.choice(SECTORS),
        problem_statement=random.choice(PROBLEMS),
        solution_description=random.choice(SOLUTIONS),
        target_market="SMEs and growth startups",
        traction=f"{random.randint(2, 15)} pilots with paying users",
        social_impact_score=random.randint(4, 10),
        team_size=random.randint(2, 8),
        team_background="Cross-functional founding team",
        preference_1=prefs[0],
        preference_2=prefs[1],
        preference_3=prefs[2],
    )


async def run_matching_simulation(db: AsyncSession, application_count: int = 10) -> dict:
    programs = (await db.execute(select(Program).where(Program.is_active.is_(True)))).scalars().all()
    if not programs:
        return {"applications": [], "programs": []}
    config_map = await ensure_program_configs(db, programs)

    feature_agent = FeatureExtractionAgent()
    scoring_agent = ScoringAgent()
    matching_agent = MatchingAgent()
    explanation_agent = ExplanationAgent()

    program_ids = [program.id for program in programs]
    program_name_map = {str(program.id): program.name for program in programs}
    simulations = []

    for seed in range(1, application_count + 1):
        app = _dummy_application(seed, program_ids)
        features = await feature_agent.run(app)
        scored_candidates = []
        for program in programs:
            config = config_map.get(program.id)
            if not config or not config.is_active:
                continue
            scored = await scoring_agent.run(app, program, config, features)
            scored_candidates.append(scored)
        winner = await matching_agent.run(scored_candidates)
        winner_program = next(program for program in programs if program.id == winner["program_id"])
        summary = await explanation_agent.score_explanation(winner_program, winner["score_parts"], winner["preference_rank"])
        ranked = sorted(scored_candidates, key=lambda row: row["final_score"], reverse=True)
        simulations.append(
            {
                "application": {
                    "startup_name": app.startup_name,
                    "founder_name": app.founder_name,
                    "stage": app.stage,
                    "sector": app.sector,
                    "city": app.city,
                },
                "matched_program_id": str(winner["program_id"]),
                "matched_program_name": program_name_map.get(str(winner["program_id"]), "Unknown"),
                "top_3_scores": [
                    {
                        "program_id": str(item["program_id"]),
                        "program_name": program_name_map.get(str(item["program_id"]), "Unknown"),
                        "program_score": float(item["program_score"]),
                        "preference_score": float(item["preference_score"]),
                        "final_score": float(item["final_score"]),
                    }
                    for item in ranked[:3]
                ],
                "explanation": summary,
            }
        )

    return {
        "applications": simulations,
        "programs": [{"id": str(program.id), "name": program.name} for program in programs],
    }

