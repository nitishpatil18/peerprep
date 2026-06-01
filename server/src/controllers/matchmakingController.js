import Profile from "../models/Profile.js";
import {
  enqueueUser,
  dequeueUser,
  getUserState,
  setUserStatus,
  releaseLock,
  queueSize,
} from "../services/queueService.js";
import { respondToProposal } from "../services/matchmakerService.js";

const STUCK_PROPOSED_MAX_AGE_MS = 60 * 1000;

async function autoRecover(userId, state) {
  if (!state || state.status !== "proposed") return state;
  const age = Date.now() - (state.enqueuedAt || 0);
  if (age < STUCK_PROPOSED_MAX_AGE_MS) return state;
  // stuck proposed state, recover
  await releaseLock(userId);
  await setUserStatus(userId, "waiting");
  return await getUserState(userId);
}

export async function joinQueue(req, res) {
  const profile = await Profile.findOne({ user: req.user.id });
  if (!profile || !profile.isComplete) {
    return res.status(400).json({ error: "complete your profile before joining queue" });
  }
  let existing = await getUserState(req.user.id);
  existing = await autoRecover(req.user.id, existing);
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
  await releaseLock(req.user.id);
  await dequeueUser(req.user.id);
  res.json({ ok: true });
}

export async function getQueueState(req, res) {
  let state = await getUserState(req.user.id);
  state = await autoRecover(req.user.id, state);
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
