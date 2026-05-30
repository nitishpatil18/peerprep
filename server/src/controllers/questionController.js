import Question from "../models/Question.js";

export async function listQuestions(req, res) {
  const { q, difficulty, topic, limit = 30 } = req.query;
  const filter = {};
  if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
    filter.difficulty = difficulty;
  }
  if (topic) {
    filter.topics = topic.toLowerCase();
  }
  if (q && q.trim()) {
    filter.$or = [
      { title: { $regex: q.trim(), $options: "i" } },
      { slug: { $regex: q.trim(), $options: "i" } },
    ];
  }
  const items = await Question.find(filter)
    .select("slug title difficulty topics")
    .sort({ difficulty: 1, title: 1 })
    .limit(Math.min(parseInt(limit, 10) || 30, 100))
    .lean();
  res.json({
    questions: items.map((i) => ({
      id: i._id.toString(),
      slug: i.slug,
      title: i.title,
      difficulty: i.difficulty,
      topics: i.topics,
    })),
  });
}

export async function getQuestion(req, res) {
  const { slug } = req.params;
  const q = await Question.findOne({ slug });
  if (!q) return res.status(404).json({ error: "question not found" });
  res.json({ question: q });
}

export async function getTopics(req, res) {
  const topics = await Question.distinct("topics");
  res.json({ topics: topics.sort() });
}
