import math
import re
from collections import Counter


SOCIAL_IMPACT_REFERENCE = (
    "social impact rural livelihoods inclusive healthcare education women empowerment "
    "climate sustainability accessibility financial inclusion underserved communities"
)

SECTOR_REFERENCES = {
    "healthcare": "hospital clinic diagnostics telemedicine medtech healthcare patient treatment care",
    "fintech": "payments lending banking credit underwriting fintech financial services",
    "edtech": "learning school student teacher education curriculum assessment edtech upskilling",
    "agritech": "farmer agriculture crop irrigation soil harvest supply chain agritech",
    "deeptech": "ai machine learning robotics semiconductor computer vision deeptech data models",
    "consumer": "retail ecommerce brand customer d2c consumer products distribution",
    "climate": "climate carbon emissions renewable energy sustainability circular green net zero",
    "social": "ngo livelihoods impact inclusion non profit development public health",
}


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z]{3,}", (text or "").lower())


def _to_vector(text: str) -> Counter:
    return Counter(_tokenize(text))


def _cosine_similarity(vec_a: Counter, vec_b: Counter) -> float:
    if not vec_a or not vec_b:
        return 0.0
    dot = sum(vec_a[token] * vec_b.get(token, 0) for token in vec_a)
    norm_a = math.sqrt(sum(v * v for v in vec_a.values()))
    norm_b = math.sqrt(sum(v * v for v in vec_b.values()))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _scale_to_10(score: float) -> float:
    return round(max(0.0, min(10.0, score * 10.0)), 2)


def score_social_impact_10(text: str) -> float:
    return _scale_to_10(_cosine_similarity(_to_vector(text), _to_vector(SOCIAL_IMPACT_REFERENCE)))


def score_sector_relevance_10(text: str) -> tuple[float, str]:
    text_vec = _to_vector(text)
    best_label = "general"
    best_similarity = 0.0
    for label, reference in SECTOR_REFERENCES.items():
        similarity = _cosine_similarity(text_vec, _to_vector(reference))
        if similarity > best_similarity:
            best_similarity = similarity
            best_label = label
    return _scale_to_10(best_similarity), best_label


def score_problem_and_company_text(problem_statement: str, company_description: str) -> dict[str, float | str]:
    problem_social = score_social_impact_10(problem_statement)
    company_social = score_social_impact_10(company_description)
    problem_sector, problem_sector_label = score_sector_relevance_10(problem_statement)
    company_sector, company_sector_label = score_sector_relevance_10(company_description)
    return {
        "problem_social_impact_10": problem_social,
        "company_social_impact_10": company_social,
        "problem_sector_relevance_10": problem_sector,
        "company_sector_relevance_10": company_sector,
        "problem_predicted_sector": problem_sector_label,
        "company_predicted_sector": company_sector_label,
    }

