import Profile from "../models/Profile.js";

const ALLOWED_TARGETS = ["sde", "mle", "ds", "frontend", "backend", "fullstack", "other"];
const ALLOWED_LEVELS = ["student", "intern", "junior", "mid", "senior"];

function isCompleteProfile(p) {
  return (
    p.skills?.length > 0 &&
    p.topics?.length > 0 &&
    p.preferredLanguages?.length > 0 &&
    p.availability?.length > 0
  );
}

function validateAvailability(slots) {
  if (!Array.isArray(slots)) return "availability must be an array";
  for (const s of slots) {
    if (
      typeof s.dayOfWeek !== "number" ||
      typeof s.startMinute !== "number" ||
      typeof s.endMinute !== "number"
    ) {
      return "invalid slot shape";
    }
    if (s.dayOfWeek < 0 || s.dayOfWeek > 6) return "dayOfWeek out of range";
    if (s.startMinute < 0 || s.startMinute > 1439) return "startMinute out of range";
    if (s.endMinute < 1 || s.endMinute > 1440) return "endMinute out of range";
    if (s.endMinute <= s.startMinute) return "endMinute must be after startMinute";
  }
  return null;
}

export async function getMyProfile(req, res) {
  let profile = await Profile.findOne({ user: req.user.id });
  if (!profile) {
    profile = await Profile.create({ user: req.user.id });
  }
  res.json({ profile });
}

export async function updateMyProfile(req, res) {
  const {
    targetRole,
    experienceLevel,
    skills,
    topics,
    preferredLanguages,
    timezone,
    bio,
    availability,
  } = req.body || {};

  const update = {};

  if (targetRole !== undefined) {
    if (!ALLOWED_TARGETS.includes(targetRole)) {
      return res.status(400).json({ error: "invalid targetRole" });
    }
    update.targetRole = targetRole;
  }
  if (experienceLevel !== undefined) {
    if (!ALLOWED_LEVELS.includes(experienceLevel)) {
      return res.status(400).json({ error: "invalid experienceLevel" });
    }
    update.experienceLevel = experienceLevel;
  }
  if (skills !== undefined) {
    if (!Array.isArray(skills)) return res.status(400).json({ error: "skills must be array" });
    update.skills = skills.map((s) => String(s).trim().toLowerCase()).filter(Boolean).slice(0, 30);
  }
  if (topics !== undefined) {
    if (!Array.isArray(topics)) return res.status(400).json({ error: "topics must be array" });
    update.topics = topics.map((s) => String(s).trim().toLowerCase()).filter(Boolean).slice(0, 30);
  }
  if (preferredLanguages !== undefined) {
    if (!Array.isArray(preferredLanguages))
      return res.status(400).json({ error: "preferredLanguages must be array" });
    update.preferredLanguages = preferredLanguages
      .map((s) => String(s).trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 10);
  }
  if (timezone !== undefined) update.timezone = String(timezone);
  if (bio !== undefined) update.bio = String(bio).slice(0, 500);
  if (availability !== undefined) {
    const err = validateAvailability(availability);
    if (err) return res.status(400).json({ error: err });
    update.availability = availability;
  }

  let profile = await Profile.findOne({ user: req.user.id });
  if (!profile) {
    profile = new Profile({ user: req.user.id, ...update });
  } else {
    Object.assign(profile, update);
  }
  profile.isComplete = isCompleteProfile(profile);
  await profile.save();
  res.json({ profile });
}
