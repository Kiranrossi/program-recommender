import asyncio
from datetime import datetime, timezone

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.program import Program


DEFAULT_CRITERIA = {
    "problem_clarity": 0.15,
    "solution_viability": 0.20,
    "market_potential": 0.15,
    "team_strength": 0.20,
    "traction": 0.15,
    "social_impact": 0.10,
    "tier2_bonus": 0.05,
}

PROGRAMS = [
    {
        "name": "Launchpad",
        "slug": "launchpad",
        "description": "A two-month pre-incubation platform for early-stage founders to validate ideas, build market readiness, and access mentors.",
        "stage": "idea",
        "max_intake": 35,
        "deadline": datetime(2026, 7, 31, tzinfo=timezone.utc),
    },
    {
        "name": "Women Startup Program (CSR by Kotak Mahindra Bank)",
        "slug": "women-startup-program",
        "description": "For women-led ventures across ideation and early growth with FOE, pre-incubation, incubation, mentorship, investor connects, and grants.",
        "stage": "idea",
        "max_intake": 60,
        "deadline": datetime(2026, 8, 15, tzinfo=timezone.utc),
    },
    {
        "name": "Campus Founders",
        "slug": "campus-founders",
        "description": "A 4-month program for student and recent graduate entrepreneurs to accelerate startup journeys.",
        "stage": "idea",
        "max_intake": 40,
        "deadline": datetime(2026, 8, 31, tzinfo=timezone.utc),
    },
    {
        "name": "Healthcare Incubation Program",
        "slug": "healthcare-incubation-program",
        "description": "A CSR-backed initiative focused on healthcare and med-tech innovations with domain guidance and incubation support.",
        "stage": "idea",
        "max_intake": 30,
        "deadline": datetime(2026, 9, 15, tzinfo=timezone.utc),
    },
    {
        "name": "Goldman Sachs 10,000 Women",
        "slug": "goldman-sachs-10000-women",
        "description": "Global flagship program to equip women entrepreneurs with tools, networks, and skills to scale sustainably.",
        "stage": "growth",
        "max_intake": 80,
        "deadline": datetime(2026, 10, 1, tzinfo=timezone.utc),
    },
    {
        "name": "Goldman Sachs 10,000 Women - Finance for Growth",
        "slug": "goldman-sachs-finance-for-growth",
        "description": "Finance-focused track with mentoring and networking to strengthen fundraising readiness across multiple learning tiers.",
        "stage": "growth",
        "max_intake": 120,
        "deadline": datetime(2026, 10, 15, tzinfo=timezone.utc),
    },
    {
        "name": "Impact Orbit - Tech-Enabled Social Innovations",
        "slug": "impact-orbit-tech-enabled-social-innovations",
        "description": "Supports social innovation startups with grant opportunities, impact investor access, and committee-led review.",
        "stage": "growth",
        "max_intake": 45,
        "deadline": datetime(2026, 9, 30, tzinfo=timezone.utc),
    },
    {
        "name": "Emerging Consumer Brands",
        "slug": "emerging-consumer-brands",
        "description": "Growth support track for consumer-focused startups building scalable brands.",
        "stage": "growth",
        "max_intake": 35,
        "deadline": datetime(2026, 11, 5, tzinfo=timezone.utc),
    },
    {
        "name": "Sustainable Mobility Incubation Program",
        "slug": "sustainable-mobility-incubation-program",
        "description": "Accelerates climate and mobility startups with mentorship, funding pathways, and impact-oriented scaling support.",
        "stage": "growth",
        "max_intake": 30,
        "deadline": datetime(2026, 11, 30, tzinfo=timezone.utc),
    },
    {
        "name": "Circular Economy Incubation Program",
        "slug": "circular-economy-incubation-program",
        "description": "Incubation pathway for startups addressing circular economy and resource efficiency opportunities.",
        "stage": "growth",
        "max_intake": 30,
        "deadline": datetime(2026, 11, 20, tzinfo=timezone.utc),
    },
    {
        "name": "Swavalambane",
        "slug": "swavalambane",
        "description": "Focused track for social and grassroots entrepreneurship with inclusive growth outcomes.",
        "stage": "growth",
        "max_intake": 40,
        "deadline": datetime(2026, 12, 5, tzinfo=timezone.utc),
    },
    {
        "name": "Velocity",
        "slug": "velocity",
        "description": "Scale-up oriented program for startups preparing for accelerated growth trajectories.",
        "stage": "growth",
        "max_intake": 50,
        "deadline": datetime(2026, 12, 15, tzinfo=timezone.utc),
    },
]


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        for item in PROGRAMS:
            exists = (await session.execute(select(Program).where(Program.slug == item["slug"]))).scalar_one_or_none()
            if exists:
                exists.name = item["name"]
                exists.description = item["description"]
                exists.criteria = {
                    **DEFAULT_CRITERIA,
                    "stage": item["stage"],
                    "max_intake": item["max_intake"],
                    "deadline": item["deadline"].isoformat(),
                }
                exists.max_intake = item["max_intake"]
                exists.application_deadline = item["deadline"]
                exists.is_active = True
                continue
            session.add(
                Program(
                    name=item["name"],
                    slug=item["slug"],
                    description=item["description"],
                    criteria={
                        **DEFAULT_CRITERIA,
                        "stage": item["stage"],
                        "max_intake": item["max_intake"],
                        "deadline": item["deadline"].isoformat(),
                    },
                    is_active=True,
                    max_intake=item["max_intake"],
                    application_deadline=item["deadline"],
                )
            )
        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed())
