import Session from "../models/Session.js";
import User from "../models/User.js";

export async function getSession(req, res) {
  const { id } = req.params;
  const session = await Session.findById(id).lean();
  if (!session) return res.status(404).json({ error: "session not found" });
  const participantIds = session.participants.map((p) => p.toString());
  if (!participantIds.includes(req.user.id)) {
    return res.status(403).json({ error: "not a participant of this session" });
  }
  const users = await User.find({ _id: { $in: session.participants } })
    .select("name avatarUrl")
    .lean();
  const userMap = {};
  for (const u of users) userMap[u._id.toString()] = { name: u.name, avatarUrl: u.avatarUrl };

  res.json({
    session: {
      id: session._id.toString(),
      status: session.status,
      participants: participantIds.map((pid) => ({
        id: pid,
        name: userMap[pid]?.name,
        avatarUrl: userMap[pid]?.avatarUrl,
        isMe: pid === req.user.id,
      })),
      matchScore: session.matchScore,
      matchReasons: session.matchReasons,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      createdAt: session.createdAt,
    },
  });
}
