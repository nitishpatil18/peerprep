const LEVEL_ORDER = ["student", "intern", "junior", "mid", "senior"];

function jaccard(a, b) {
  const sa = new Set(a || []);
  const sb = new Set(b || []);
  if (sa.size === 0 && sb.size === 0) return 0;
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

function levelScore(a, b) {
  const ia = LEVEL_ORDER.indexOf(a);
  const ib = LEVEL_ORDER.indexOf(b);
  if (ia < 0 || ib < 0) return 0.5;
  const dist = Math.abs(ia - ib);
  return Math.max(0, 1 - dist / 2);
}

function roleScore(a, b) {
  if (a === b) return 1;
  const adjacent = new Set([
    ["sde", "backend"].sort().join(":"),
    ["sde", "fullstack"].sort().join(":"),
    ["sde", "frontend"].sort().join(":"),
    ["backend", "fullstack"].sort().join(":"),
    ["frontend", "fullstack"].sort().join(":"),
    ["mle", "ds"].sort().join(":"),
    ["mle", "backend"].sort().join(":"),
  ]);
  const key = [a, b].sort().join(":");
  return adjacent.has(key) ? 0.6 : 0.2;
}

function availabilityNow(profile) {
  const now = new Date();
  const day = now.getDay();
  const minute = now.getHours() * 60 + now.getMinutes();
  return (profile.availability || []).some(
    (s) => s.dayOfWeek === day && minute >= s.startMinute && minute < s.endMinute
  );
}

export function scoreMatch(a, b) {
  const topicSim = jaccard(a.topics, b.topics);
  const skillSim = jaccard(a.skills, b.skills);
  const langSim = jaccard(a.preferredLanguages, b.preferredLanguages);
  const levelSim = levelScore(a.experienceLevel, b.experienceLevel);
  const roleSim = roleScore(a.targetRole, b.targetRole);
  const bothAvailNow = availabilityNow(a) && availabilityNow(b) ? 1 : 0.7;

  const score =
    0.30 * topicSim +
    0.20 * levelSim +
    0.15 * langSim +
    0.15 * roleSim +
    0.10 * skillSim +
    0.10 * bothAvailNow;

  return {
    score,
    breakdown: {
      topicSim,
      skillSim,
      langSim,
      levelSim,
      roleSim,
      bothAvailNow,
    },
  };
}

export const MATCH_THRESHOLD = 0.4;
