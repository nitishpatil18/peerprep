import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import TagInput from "../components/TagInput.jsx";
import AvailabilityPicker from "../components/AvailabilityPicker.jsx";
import { useProfileStore } from "../store/profileStore.js";
import {
  TARGET_ROLES,
  EXPERIENCE_LEVELS,
  COMMON_TOPICS,
  COMMON_LANGUAGES,
} from "../utils/constants.js";

export default function Profile() {
  const { profile, fetchProfile, updateProfile, loading, error } = useProfileStore();
  const nav = useNavigate();

  const [targetRole, setTargetRole] = useState("sde");
  const [experienceLevel, setExperienceLevel] = useState("student");
  const [skills, setSkills] = useState([]);
  const [topics, setTopics] = useState([]);
  const [preferredLanguages, setPreferredLanguages] = useState([]);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [bio, setBio] = useState("");
  const [availability, setAvailability] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!profile) return;
    setTargetRole(profile.targetRole || "sde");
    setExperienceLevel(profile.experienceLevel || "student");
    setSkills(profile.skills || []);
    setTopics(profile.topics || []);
    setPreferredLanguages(profile.preferredLanguages || []);
    setTimezone(profile.timezone || "Asia/Kolkata");
    setBio(profile.bio || "");
    setAvailability(profile.availability || []);
  }, [profile]);

  async function handleSave(e) {
    e.preventDefault();
    setSaved(false);
    try {
      await updateProfile({
        targetRole,
        experienceLevel,
        skills,
        topics,
        preferredLanguages,
        timezone,
        bio,
        availability,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // error already in store
    }
  }

  function handleContinue() {
    nav("/");
  }

  const isComplete =
    skills.length > 0 &&
    topics.length > 0 &&
    preferredLanguages.length > 0 &&
    availability.length > 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-2">your profile</h1>
        <p className="text-sm text-zinc-400 mb-8">
          we use this to match you with peers of similar level and overlapping availability.
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-1">target role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
              >
                {TARGET_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-1">experience level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
              >
                {EXPERIENCE_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-zinc-400 block mb-1">skills</label>
            <TagInput
              value={skills}
              onChange={setSkills}
              placeholder="type a skill and press enter (e.g. react, fastapi)"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400 block mb-1">topics to practice</label>
            <TagInput
              value={topics}
              onChange={setTopics}
              suggestions={COMMON_TOPICS}
              placeholder="type topics or pick from suggestions"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400 block mb-1">preferred languages</label>
            <TagInput
              value={preferredLanguages}
              onChange={setPreferredLanguages}
              suggestions={COMMON_LANGUAGES}
              placeholder="languages you code in"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400 block mb-1">timezone</label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded"
              placeholder="Asia/Kolkata"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400 block mb-1">bio (optional)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded resize-none"
              placeholder="short intro, max 500 chars"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400 block mb-2">weekly availability</label>
            <AvailabilityPicker value={availability} onChange={setAvailability} />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {saved && <p className="text-green-400 text-sm">saved.</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded font-medium disabled:opacity-50"
            >
              {loading ? "saving..." : "save"}
            </button>
            {isComplete && (
              <button
                type="button"
                onClick={handleContinue}
                className="px-4 py-2 border border-zinc-700 rounded text-zinc-200 hover:bg-zinc-900"
              >
                continue to home
              </button>
            )}
            {!isComplete && (
              <span className="text-xs text-zinc-500">
                fill skills, topics, languages, and at least one availability slot to enable matchmaking.
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
