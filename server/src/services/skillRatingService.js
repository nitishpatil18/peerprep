import SkillRating from "../models/SkillRating.js";
import Question from "../models/Question.js";

const DEFAULT_RATING = 1000;
const MIN_RATING = 400;
const MAX_RATING = 2000;
const BASE_K = 32;
const MIN_K = 8;
const K_DECAY_PER_GAME = 2;

function kFactor(gamesPlayed) {
  return Math.max(MIN_K, BASE_K - gamesPlayed * K_DECAY_PER_GAME);
}

function peerFactor(peerRating) {
  return (peerRating - 3) / 2;
}

function difficultyFactor(difficultyRating) {
  if (difficultyRating === "too_easy") return 1;
  if (difficultyRating === "too_hard") return -1;
  return 0;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export async function updateSkillRatings(userId, { peerRating, difficultyRating, questionSlug }) {
  if (!questionSlug) return [];

  const question = await Question.findOne({ slug: questionSlug }).lean();
  if (!question || !question.topics?.length) return [];

  const topics = question.topics;
  const updates = [];

  for (const topic of topics) {
    let record = await SkillRating.findOne({ user: userId, topic });
    if (!record) {
      record = new SkillRating({ user: userId, topic });
    }

    const k = kFactor(record.gamesPlayed);
    const pf = peerFactor(peerRating);
    const df = difficultyFactor(difficultyRating);
    const delta = k * (0.6 * pf + 0.4 * df);

    record.rating = clamp(record.rating + delta, MIN_RATING, MAX_RATING);
    record.gamesPlayed += 1;
    record.lastUpdated = new Date();

    await record.save();
    updates.push(record.toJSON());
  }

  return updates;
}

export async function getUserSkillRatings(userId) {
  const ratings = await SkillRating.find({ user: userId })
    .sort({ rating: -1 })
    .lean();
  return ratings.map((r) => ({
    topic: r.topic,
    rating: Math.round(r.rating),
    gamesPlayed: r.gamesPlayed,
    lastUpdated: r.lastUpdated,
  }));
}

export async function getTopicRating(userId, topic) {
  const r = await SkillRating.findOne({ user: userId, topic: topic.toLowerCase() });
  return r ? Math.round(r.rating) : DEFAULT_RATING;
}
