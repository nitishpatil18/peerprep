import Question from "../models/Question.js";
import Session from "../models/Session.js";
import { getUserSkillRatings } from "../services/skillRatingService.js";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const TIMEOUT_MS = 90000;

export async function getRecommendations(req, res) {
  try {
    const [questions, skillRatings, sessions] = await Promise.all([
      Question.find({}).select("slug title topics difficulty statement").lean(),
      getUserSkillRatings(req.user.id),
      Session.find({
        participants: req.user.id,
        status: "completed",
        finalQuestionSlug: { $ne: null },
      })
        .select("finalQuestionSlug")
        .lean(),
    ]);

    const attemptedSlugs = [...new Set(sessions.map((s) => s.finalQuestionSlug).filter(Boolean))];

    const payload = {
      questions: questions.map((q) => ({
        slug: q.slug,
        title: q.title,
        topics: q.topics || [],
        difficulty: q.difficulty,
        statement: (q.statement || "").slice(0, 300),
      })),
      skillRatings: skillRatings.map((r) => ({
        topic: r.topic,
        rating: r.rating,
        gamesPlayed: r.gamesPlayed,
      })),
      attemptedSlugs,
      topK: 5,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let mlResult;
    try {
      const resp = await fetch(`${ML_SERVICE_URL}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!resp.ok) throw new Error(`ml service returned ${resp.status}`);
      mlResult = await resp.json();
    } catch (mlErr) {
      clearTimeout(timeout);
      console.error("ml service error:", mlErr.message);
      const fallback = questions
        .filter((q) => !attemptedSlugs.includes(q.slug))
        .slice(0, 5)
        .map((q) => ({
          slug: q.slug,
          title: q.title,
          topics: q.topics,
          difficulty: q.difficulty,
          score: 0.5,
          reasons: ["explore this topic"],
        }));
      return res.json({
        recommendations: fallback,
        fallback: true,
        weakTopics: [],
      });
    }

    res.json({
      recommendations: mlResult.recommendations,
      timingMs: mlResult.timing_ms,
      weakTopics: mlResult.weak_topics || [],
      fallback: false,
    });
  } catch (e) {
    console.error("recommend error:", e);
    res.status(500).json({ error: "failed to get recommendations" });
  }
}
