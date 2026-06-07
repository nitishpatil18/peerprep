from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import time

app = FastAPI(title="peerprep-ml")

_vectorizer: Optional[TfidfVectorizer] = None
_question_matrix = None
_question_slugs: List[str] = []


def get_vectorizer():
    return _vectorizer


@app.get("/health")
def health():
    return {"ok": True, "model_loaded": _vectorizer is not None, "cached": len(_question_slugs)}


class Question(BaseModel):
    slug: str
    title: str
    topics: List[str]
    difficulty: str
    statement: str


class SkillRating(BaseModel):
    topic: str
    rating: float
    gamesPlayed: int = 0


class RecommendRequest(BaseModel):
    questions: List[Question]
    skillRatings: List[SkillRating] = []
    attemptedSlugs: List[str] = []
    topK: int = 5


def build_text(q: Question) -> str:
    return f"{q.title} {q.statement[:200]} {' '.join(q.topics)} {q.difficulty}"


def get_or_fit_vectorizer(questions: List[Question]):
    global _vectorizer, _question_matrix, _question_slugs

    slugs = [q.slug for q in questions]
    if _vectorizer is not None and slugs == _question_slugs:
        return _vectorizer, _question_matrix

    texts = [build_text(q) for q in questions]
    vec = TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)
    matrix = vec.fit_transform(texts)

    _vectorizer = vec
    _question_matrix = matrix
    _question_slugs = slugs

    return vec, matrix


@app.post("/recommend")
async def recommend(req: RecommendRequest):
    start = time.time()

    skill_map = {sr.topic: sr.rating for sr in req.skillRatings}
    attempted = set(req.attemptedSlugs)

    candidates = [q for q in req.questions if q.slug not in attempted]
    if not candidates:
        candidates = req.questions

    weak_topics = [sr.topic for sr in req.skillRatings if sr.rating < 1000]
    if not weak_topics:
        if skill_map:
            weak_topics = sorted(skill_map, key=lambda t: skill_map[t])[:3]
        else:
            weak_topics = ["arrays", "dp", "trees"]

    vec, full_matrix = get_or_fit_vectorizer(req.questions)

    candidate_slugs = {q.slug for q in candidates}
    candidate_indices = [i for i, q in enumerate(req.questions) if q.slug in candidate_slugs]
    candidate_questions = [req.questions[i] for i in candidate_indices]

    candidate_matrix = full_matrix[candidate_indices]

    weak_text = f"practice {' '.join(weak_topics)} interview problems"
    user_vec = vec.transform([weak_text])
    similarities = cosine_similarity(user_vec, candidate_matrix).flatten()

    scored = []
    for i, q in enumerate(candidate_questions):
        semantic_score = float(similarities[i])

        q_topics = set(q.topics)
        weak_set = set(weak_topics)
        union = q_topics | weak_set
        topic_overlap = len(q_topics & weak_set) / len(union) if union else 0.0

        avg_rating = float(np.mean([skill_map.get(t, 1000) for t in q.topics])) if q.topics else 1000.0
        diff_score = difficulty_fit(q.difficulty, avg_rating)

        score = 0.35 * semantic_score + 0.40 * topic_overlap + 0.25 * diff_score

        overlap_list = list(q_topics & weak_set)
        reasons = []
        if overlap_list:
            reasons.append(f"targets weak area: {', '.join(overlap_list[:2])}")
        if avg_rating < 900 and q.difficulty == "easy":
            reasons.append("right difficulty for your level")
        elif avg_rating > 1100 and q.difficulty == "hard":
            reasons.append("challenge level")
        elif q.difficulty == "medium":
            reasons.append("medium difficulty")
        if not reasons:
            reasons.append("broadens your coverage")

        scored.append({
            "slug": q.slug,
            "title": q.title,
            "topics": q.topics,
            "difficulty": q.difficulty,
            "score": round(score, 4),
            "reasons": reasons,
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    timing_ms = round((time.time() - start) * 1000, 1)

    return {
        "recommendations": scored[:req.topK],
        "timing_ms": timing_ms,
        "weak_topics": weak_topics,
    }


def difficulty_fit(difficulty: str, avg_rating: float) -> float:
    if avg_rating < 900:
        return {"easy": 1.0, "medium": 0.5, "hard": 0.1}.get(difficulty, 0.5)
    elif avg_rating > 1100:
        return {"easy": 0.2, "medium": 0.7, "hard": 1.0}.get(difficulty, 0.5)
    else:
        return {"easy": 0.5, "medium": 1.0, "hard": 0.6}.get(difficulty, 0.5)
