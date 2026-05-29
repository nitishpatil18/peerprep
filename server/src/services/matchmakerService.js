import { getRedis } from "../config/redis.js";
import {
  getAllWaiting,
  setUserStatus,
  acquireLock,
  releaseLock,
  dequeueUser,
} from "./queueService.js";
import { scoreMatch, MATCH_THRESHOLD } from "./scoringService.js";
import { emitToUser } from "../sockets/index.js";
import Session from "../models/Session.js";

const TICK_MS = 2000;
const PROPOSAL_TTL_SECONDS = 30;
const PROPOSAL_KEY = (id) => `mm:proposal:${id}`;
const PROPOSAL_LOCK_KEY = (id) => `mm:proposal-lock:${id}`;

let timer = null;

function makeProposalId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function findBestPair(waiting) {
  let best = null;
  for (let i = 0; i < waiting.length; i++) {
    for (let j = i + 1; j < waiting.length; j++) {
      const a = waiting[i];
      const b = waiting[j];
      const { score, breakdown } = scoreMatch(a.profile, b.profile);
      if (score < MATCH_THRESHOLD) continue;
      if (!best || score > best.score) {
        best = { a, b, score, breakdown };
      }
    }
  }
  return best;
}

async function proposeMatch(pair) {
  const r = getRedis();
  const lockedA = await acquireLock(pair.a.userId, 30000);
  if (!lockedA) return false;
  const lockedB = await acquireLock(pair.b.userId, 30000);
  if (!lockedB) {
    await releaseLock(pair.a.userId);
    return false;
  }

  await setUserStatus(pair.a.userId, "proposed");
  await setUserStatus(pair.b.userId, "proposed");

  const proposalId = makeProposalId();
  const proposal = {
    proposalId,
    users: [pair.a.userId, pair.b.userId],
    accepts: {},
    score: pair.score,
    breakdown: pair.breakdown,
    createdAt: Date.now(),
  };
  await r.set(PROPOSAL_KEY(proposalId), JSON.stringify(proposal), "EX", PROPOSAL_TTL_SECONDS);

  emitToUser(pair.a.userId, "match:proposal", {
    proposalId,
    peerUserId: pair.b.userId,
    score: pair.score,
    breakdown: pair.breakdown,
    expiresInMs: PROPOSAL_TTL_SECONDS * 1000,
  });
  emitToUser(pair.b.userId, "match:proposal", {
    proposalId,
    peerUserId: pair.a.userId,
    score: pair.score,
    breakdown: pair.breakdown,
    expiresInMs: PROPOSAL_TTL_SECONDS * 1000,
  });

  setTimeout(() => expireProposal(proposalId), PROPOSAL_TTL_SECONDS * 1000);
  return true;
}

export async function getProposal(proposalId) {
  const r = getRedis();
  const raw = await r.get(PROPOSAL_KEY(proposalId));
  return raw ? JSON.parse(raw) : null;
}

async function withProposalLock(proposalId, fn) {
  const r = getRedis();
  const lockKey = PROPOSAL_LOCK_KEY(proposalId);
  const start = Date.now();
  while (Date.now() - start < 5000) {
    const ok = await r.set(lockKey, "1", "PX", 3000, "NX");
    if (ok === "OK") {
      try {
        return await fn();
      } finally {
        await r.del(lockKey);
      }
    }
    await new Promise((res) => setTimeout(res, 50));
  }
  throw new Error("could not acquire proposal lock");
}

export async function respondToProposal(proposalId, userId, accept) {
  return withProposalLock(proposalId, async () => {
    const r = getRedis();
    const proposal = await getProposal(proposalId);
    if (!proposal) return { error: "proposal expired or invalid" };
    if (!proposal.users.includes(userId)) return { error: "not your proposal" };

    if (!accept) {
      await cancelProposal(proposal, userId);
      return { ok: true, cancelled: true };
    }

    proposal.accepts[userId] = true;
    await r.set(PROPOSAL_KEY(proposalId), JSON.stringify(proposal), "EX", PROPOSAL_TTL_SECONDS);

    const bothAccepted = proposal.users.every((u) => proposal.accepts[u]);
    if (!bothAccepted) {
      const otherUser = proposal.users.find((u) => u !== userId);
      emitToUser(otherUser, "match:peer-accepted", { proposalId });
      return { ok: true, waitingForPeer: true };
    }

    const session = await Session.create({
      participants: proposal.users,
      status: "pending",
      matchScore: proposal.score,
      matchReasons: proposal.breakdown,
    });

    for (const uid of proposal.users) {
      await dequeueUser(uid);
      await releaseLock(uid);
      emitToUser(uid, "match:confirmed", {
        sessionId: session._id.toString(),
        peerUserId: proposal.users.find((u) => u !== uid),
      });
    }
    await r.del(PROPOSAL_KEY(proposalId));
    return { ok: true, sessionId: session._id.toString() };
  });
}

async function cancelProposal(proposal, declinerUserId) {
  const r = getRedis();
  for (const uid of proposal.users) {
    await releaseLock(uid);
    if (uid !== declinerUserId) {
      await setUserStatus(uid, "waiting");
      emitToUser(uid, "match:cancelled", {
        proposalId: proposal.proposalId,
        reason: "peer declined",
      });
    } else {
      await dequeueUser(uid);
    }
  }
  await r.del(PROPOSAL_KEY(proposal.proposalId));
}

async function expireProposal(proposalId) {
  const proposal = await getProposal(proposalId);
  if (!proposal) return;
  const bothAccepted = proposal.users.every((u) => proposal.accepts[u]);
  if (bothAccepted) return;
  const r = getRedis();
  for (const uid of proposal.users) {
    await releaseLock(uid);
    if (proposal.accepts[uid]) {
      await setUserStatus(uid, "waiting");
      emitToUser(uid, "match:cancelled", {
        proposalId,
        reason: "peer did not respond",
      });
    } else {
      await dequeueUser(uid);
      emitToUser(uid, "match:cancelled", {
        proposalId,
        reason: "you did not respond in time",
      });
    }
  }
  await r.del(PROPOSAL_KEY(proposalId));
}

async function tick() {
  try {
    const waiting = await getAllWaiting();
    if (waiting.length < 2) return;
    const best = await findBestPair(waiting);
    if (!best) return;
    await proposeMatch(best);
  } catch (e) {
    console.error("matchmaker tick error:", e.message);
  }
}

export function startMatchmaker() {
  if (timer) return;
  timer = setInterval(tick, TICK_MS);
  console.log(`matchmaker started, tick=${TICK_MS}ms`);
}

export function stopMatchmaker() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
