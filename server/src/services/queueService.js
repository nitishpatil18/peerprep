import { getRedis } from "../config/redis.js";

const QUEUE_KEY = "mm:queue";
const USER_KEY = (userId) => `mm:user:${userId}`;
const LOCK_KEY = (userId) => `mm:lock:${userId}`;
const STATE_TTL_SECONDS = 60 * 30;

export async function enqueueUser(entry) {
  const r = getRedis();
  const now = Date.now();
  const payload = {
    userId: entry.userId,
    profile: entry.profile,
    enqueuedAt: now,
    status: "waiting",
  };
  await r.set(USER_KEY(entry.userId), JSON.stringify(payload), "EX", STATE_TTL_SECONDS);
  await r.zadd(QUEUE_KEY, now, entry.userId);
  return payload;
}

export async function dequeueUser(userId) {
  const r = getRedis();
  await r.zrem(QUEUE_KEY, userId);
  await r.del(USER_KEY(userId));
}

export async function setUserStatus(userId, status) {
  const r = getRedis();
  const raw = await r.get(USER_KEY(userId));
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  parsed.status = status;
  await r.set(USER_KEY(userId), JSON.stringify(parsed), "EX", STATE_TTL_SECONDS);
  return parsed;
}

export async function getUserState(userId) {
  const r = getRedis();
  const raw = await r.get(USER_KEY(userId));
  return raw ? JSON.parse(raw) : null;
}

export async function getAllWaiting() {
  const r = getRedis();
  const userIds = await r.zrange(QUEUE_KEY, 0, -1);
  if (userIds.length === 0) return [];
  const keys = userIds.map(USER_KEY);
  const raws = await r.mget(keys);
  return raws
    .map((s) => (s ? JSON.parse(s) : null))
    .filter((p) => p && p.status === "waiting");
}

export async function acquireLock(userId, ttlMs = 5000) {
  const r = getRedis();
  const ok = await r.set(LOCK_KEY(userId), "1", "PX", ttlMs, "NX");
  return ok === "OK";
}

export async function releaseLock(userId) {
  const r = getRedis();
  await r.del(LOCK_KEY(userId));
}

export async function queueSize() {
  const r = getRedis();
  return r.zcard(QUEUE_KEY);
}
