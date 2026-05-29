import Profile from "../models/Profile.js";
import {
  enqueueUser,
  dequeueUser,
  getUserState,
  queueSize,
} from "../services/queueService.js";
import { respondToProposal } from "../services/matchmakerService.js";

export async function joinQueue(req, res) {
  const profile = await Profile.findOne({ user: req.user.id });
  if (!profile || !profile.isComplete) {
    return res.status(400).json({ error: "complete your profile before joining queue" });
  }
  const existing = await getUserState(req.user.id);
  if (existing) {
    return res.status(200).json({ state: existing, alreadyInQueue: true });
  }
  const state = await enqueueUser({
    userId: req.user.id,
    profile: {
      targetRole: profile.targetRole,
      experienceLevel: profile.experienceLevel,
      skills: profile.skills,
      topics: profile.topics,
      preferredLanguages: profile.preferredLanguages,
      timezone: profile.timezone,
      availability: profile.availability,
    },
  });
  res.json({ state });
}

export async function leaveQueue(req, res) {
  await dequeueUser(req.user.id);
  res.json({ ok: true });
}

export async function getQueueState(req, res) {
  const state = await getUserState(req.user.id);
  const size = await queueSize();
  res.json({ state, queueSize: size });
}

export async function respondProposal(req, res) {
  const { proposalId, accept } = req.body || {};
  if (!proposalId || typeof accept !== "boolean") {
    return res.status(400).json({ error: "proposalId and accept required" });
  }
  const result = await respondToProposal(proposalId, req.user.id, accept);
  if (result.error) return res.status(400).json(result);
  res.json(result);
}
