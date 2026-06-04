import Session from "../models/Session.js";
import SessionFeedback from "../models/SessionFeedback.js";

const ALLOWED_DIFFICULTY = ["too_easy", "right", "too_hard"];

export async function submitFeedback(req, res) {
  const { sessionId } = req.params;
  const { peerRating, difficultyRating, notes } = req.body || {};

  if (!Number.isInteger(peerRating) || peerRating < 1 || peerRating > 5) {
    return res.status(400).json({ error: "peerRating must be 1-5 integer" });
  }
  if (!ALLOWED_DIFFICULTY.includes(difficultyRating)) {
    return res.status(400).json({ error: "invalid difficultyRating" });
  }

  const session = await Session.findById(sessionId);
  if (!session) return res.status(404).json({ error: "session not found" });

  const participantIds = session.participants.map((p) => p.toString());
  if (!participantIds.includes(req.user.id)) {
    return res.status(403).json({ error: "not a participant of this session" });
  }
  const peerId = participantIds.find((pid) => pid !== req.user.id);
  if (!peerId) {
    return res.status(400).json({ error: "no peer in session" });
  }

  const update = {
    session: sessionId,
    rater: req.user.id,
    ratee: peerId,
    peerRating,
    difficultyRating,
    questionSlug: session.finalQuestionSlug || null,
    notes: typeof notes === "string" ? notes.slice(0, 500) : "",
  };

  const feedback = await SessionFeedback.findOneAndUpdate(
    { session: sessionId, rater: req.user.id },
    update,
    { upsert: true, new: true }
  );

  res.json({ feedback });
}

export async function getMyFeedbackForSession(req, res) {
  const { sessionId } = req.params;
  const feedback = await SessionFeedback.findOne({
    session: sessionId,
    rater: req.user.id,
  });
  res.json({ feedback: feedback || null });
}
