import Session from "../models/Session.js";
import User from "../models/User.js";
import { emitToUser } from "../sockets/index.js";
import { getSnapshot } from "../services/sessionDocStore.js";
import { dropInMemoryDoc } from "../sockets/yjs-vendor/setupWSConnection.js";

async function hydrateSession(session, requesterId) {
  const participantIds = session.participants.map((p) => p.toString());
  const users = await User.find({ _id: { $in: session.participants } })
    .select("name avatarUrl")
    .lean();
  const userMap = {};
  for (const u of users) userMap[u._id.toString()] = { name: u.name, avatarUrl: u.avatarUrl };

  return {
    id: session._id.toString(),
    status: session.status,
    participants: participantIds.map((pid) => ({
      id: pid,
      name: userMap[pid]?.name,
      avatarUrl: userMap[pid]?.avatarUrl,
      isMe: pid === requesterId,
    })),
    matchScore: session.matchScore,
    matchReasons: session.matchReasons,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationSeconds: session.durationSeconds,
    finalCode: session.finalCode,
    finalLanguage: session.finalLanguage,
    finalQuestionSlug: session.finalQuestionSlug,
    createdAt: session.createdAt,
  };
}

export async function getSession(req, res) {
  const { id } = req.params;
  const session = await Session.findById(id);
  if (!session) return res.status(404).json({ error: "session not found" });
  const participantIds = session.participants.map((p) => p.toString());
  if (!participantIds.includes(req.user.id)) {
    return res.status(403).json({ error: "not a participant of this session" });
  }

  if (session.status === "pending") {
    session.status = "active";
    session.startedAt = new Date();
    await session.save();
  }

  res.json({ session: await hydrateSession(session, req.user.id) });
}

export async function endSession(req, res) {
  const { id } = req.params;
  const session = await Session.findById(id);
  if (!session) return res.status(404).json({ error: "session not found" });
  const participantIds = session.participants.map((p) => p.toString());
  if (!participantIds.includes(req.user.id)) {
    return res.status(403).json({ error: "not a participant of this session" });
  }
  if (session.status === "completed" || session.status === "cancelled") {
    return res.json({ session: await hydrateSession(session, req.user.id) });
  }

  const snapshot = getSnapshot(id);
  if (snapshot) {
    session.finalCode = snapshot.code || "";
    session.finalLanguage = snapshot.language || "python";
    session.finalQuestionSlug = snapshot.questionSlug || null;
  }

  session.status = "completed";
  session.endedAt = new Date();
  session.endedBy = req.user.id;
  if (session.startedAt) {
    session.durationSeconds = Math.max(
      0,
      Math.floor((session.endedAt - session.startedAt) / 1000)
    );
  }
  await session.save();

  for (const pid of participantIds) {
    emitToUser(pid, "session:ended", {
      sessionId: id,
      endedBy: req.user.id,
    });
  }

  dropInMemoryDoc(id);

  res.json({ session: await hydrateSession(session, req.user.id) });
}

export async function listMySessions(req, res) {
  const sessions = await Session.find({ participants: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const otherIds = new Set();
  for (const s of sessions) {
    for (const p of s.participants) {
      if (p.toString() !== req.user.id) otherIds.add(p.toString());
    }
  }
  const users = await User.find({ _id: { $in: Array.from(otherIds) } })
    .select("name avatarUrl")
    .lean();
  const userMap = {};
  for (const u of users) userMap[u._id.toString()] = { name: u.name, avatarUrl: u.avatarUrl };

  const items = sessions.map((s) => {
    const peer = s.participants.map((p) => p.toString()).find((pid) => pid !== req.user.id);
    return {
      id: s._id.toString(),
      status: s.status,
      peer: peer ? { id: peer, name: userMap[peer]?.name, avatarUrl: userMap[peer]?.avatarUrl } : null,
      matchScore: s.matchScore,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      durationSeconds: s.durationSeconds,
      finalLanguage: s.finalLanguage,
      finalQuestionSlug: s.finalQuestionSlug,
      createdAt: s.createdAt,
    };
  });
  res.json({ sessions: items });
}
