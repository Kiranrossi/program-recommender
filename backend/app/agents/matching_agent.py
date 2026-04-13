from app.services.matching_service import pick_winner


class MatchingAgent:
    """Step 3 agent: select best matched program from scored candidates."""

    async def run(self, scored_candidates: list[dict]) -> dict:
        return pick_winner(scored_candidates)

