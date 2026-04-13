from typing import Any

from app.services.feature_extraction import extract_features


class FeatureExtractionAgent:
    """Step 1 agent: extract structured features from raw application."""

    async def run(self, application: Any) -> dict[str, Any]:
        return extract_features(application)

