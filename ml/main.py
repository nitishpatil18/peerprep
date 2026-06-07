from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Optional
import numpy as np
import time

app = FastAPI(title="peerprep-ml")

_model = None
_embedding_cache: Dict[str, List[float]] = {}


def get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        print("loading all-MiniLM-L6-v2 ...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        print("model ready")
    return _model


@app.get("/health")
def health():
    return {"ok": True, "model_loaded": _model is not None, "cached": len(_embedding_cache)}


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


@app.post("/recommend")
async def recommend(req: RecommendRequest):
    start = time.time()
    model = get_model()

    skill_map = {sr.topic: sr.rating for sr in req.skillRatings}
    attempted = set(req.attemptedSlugs)

    candidates = [q for q in req.questions if q.slug not in attempted]
    if not candidates:
        candidates = req.questions

    # embed questions not yet cached
    to_embed = [q for q in candidates if q.slug not in _embedding_cache]
    if to_embed:
        texts = [
            f"{q.title}. {q.statement[:200]}. topics: {', '.join(q.topics)}"
            for q in to_embed
        ]
        embeddings = model.encode(texts, normalize_embeddings=True)
        for q, emb in zip(to_embed, embeddings):
            _embedding_cache[q.slug] = emb.tolist()

    # identify weak topics (below 1000 rating)
    weak_topics = [sr.topic for sr in req.skillRatings if sr.rating < 1000]
    if not weak_topics:
        weak_topics = list(skill_map.keys()) if skill_map else ["arrays", "dp", "trees"]

    # user weakness vector
    weak_text = f"interview practice: {', '.join(weak_topics)}"
    user_vec = np.array(model.encode(weak_text, normalize_embeddings=True))

    scored = []
    for q in candidates:
        q_vec = np.array(_embedding_cache.get(q.slug, []))
        semantic_score = float(np.dot(user_vec, q_vec)) if len(q_vec) > 1 else 0.5

        q_topics = set(q.topics)
        weak_set = set(weak_topics)
        union = q_topics | weak_set
        topic_overlap = len(q_topics & weak_set) / len(union) if union else 0.0

        avg_rating = float(np.mean([skill_map.get(t, 1000) for t in q.topics])) if q.topics else 1000.0
        diff_score = difficulty_fit(q.difficulty, avg_rating)

        score = 0.40 * semantic_score + 0.35 * topic_overlap + 0.25 * diff_score

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
