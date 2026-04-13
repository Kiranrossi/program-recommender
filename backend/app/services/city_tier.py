from app.utils.tier2_cities import is_tier2_city


TIER3_HINTS = {
    "rural",
    "village",
    "taluk",
}


def classify_city_tier(city: str) -> str:
    normalized = (city or "").strip().lower()
    if not normalized:
        return "tier1"
    if is_tier2_city(normalized):
        return "tier2"
    if any(token in normalized for token in TIER3_HINTS):
        return "tier3"
    return "tier1"

