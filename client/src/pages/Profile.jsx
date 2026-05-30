import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Save, ArrowRight, AlertCircle } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import TagInput from "../components/TagInput.jsx";
import AvailabilityPicker from "../components/AvailabilityPicker.jsx";
import { Container, Card, Button, Input, Badge, Spinner } from "../components/ui";
import { useProfileStore } from "../store/profileStore.js";
import {
  TARGET_ROLES,
  EXPERIENCE_LEVELS,
  COMMON_TOPICS,
  COMMON_LANGUAGES,
} from "../utils/constants.js";

function Section({ title, description, children }) {
  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="font-medium text-zinc-100">{title}</h2>
        {description && <p className="text-sm text-zinc-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

function FieldLabel({ children, hint }) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-xs font-medium text-zinc-300">{children}</label>
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </div>
  );
}

function Select({ value, onChange, options, className = "" }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`w-full h-10 px-3 rounded-md bg-zinc-900/60 border border-zinc-800 text-zinc-100 hover:border-zinc-700 focus:border-brand-500 focus-ring transition-colors ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

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
    e?.preventDefault();
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
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // error already in store
    }
  }

  const isComplete =
    skills.length > 0 &&
    topics.length > 0 &&
    preferredLanguages.length > 0 &&
    availability.length > 0;

  const completionItems = [
    { label: "skills", done: skills.length > 0 },
    { label: "topics", done: topics.length > 0 },
    { label: "languages", done: preferredLanguages.length > 0 },
    { label: "availability", done: availability.length > 0 },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      <Container size="md" className="py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">profile</h1>
          <p className="mt-1 text-sm text-zinc-400">
            we use this to find peers with overlapping topics, level, and schedule.
          </p>
        </div>

        <Card className={`p-4 mb-6 ${isComplete ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
          <div className="flex items-start gap-3">
            <div
              className={`h-9 w-9 rounded-md flex items-center justify-center flex-shrink-0 ${
                isComplete
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
              }`}
            >
              {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {isComplete ? "profile complete" : "profile incomplete"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {completionItems.map((c) => (
                  <Badge key={c.label} tone={c.done ? "success" : "default"}>
                    {c.done ? <CheckCircle2 className="h-3 w-3" /> : null} {c.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <form onSubmit={handleSave} className="space-y-4">
          <Section title="role and level" description="what are you preparing for?">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel>target role</FieldLabel>
                <Select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  options={TARGET_ROLES}
                />
              </div>
              <div>
                <FieldLabel>experience level</FieldLabel>
                <Select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  options={EXPERIENCE_LEVELS}
                />
              </div>
            </div>
          </Section>

          <Section title="skills" description="tools, frameworks, languages you've worked with.">
            <FieldLabel hint={`${skills.length} added`}>tags</FieldLabel>
            <TagInput
              value={skills}
              onChange={setSkills}
              placeholder="press enter after each (e.g. react, fastapi, pytorch)"
            />
          </Section>

          <Section title="topics to practice" description="what you want to drill in mock interviews.">
            <FieldLabel hint={`${topics.length} added`}>topics</FieldLabel>
            <TagInput
              value={topics}
              onChange={setTopics}
              suggestions={COMMON_TOPICS}
              placeholder="type or pick from suggestions"
            />
          </Section>

          <Section title="programming languages" description="languages you write code in.">
            <FieldLabel hint={`${preferredLanguages.length} added`}>languages</FieldLabel>
            <TagInput
              value={preferredLanguages}
              onChange={setPreferredLanguages}
              suggestions={COMMON_LANGUAGES}
              placeholder="languages you code in"
            />
          </Section>

          <Section title="timezone and bio">
            <div className="space-y-4">
              <div>
                <FieldLabel>timezone</FieldLabel>
                <Input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="Asia/Kolkata"
                />
              </div>
              <div>
                <FieldLabel hint={`${bio.length}/500`}>bio (optional)</FieldLabel>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="a short intro for peers you match with"
                  className="w-full px-3 py-2 rounded-md bg-zinc-900/60 border border-zinc-800 text-zinc-100 hover:border-zinc-700 focus:border-brand-500 focus-ring transition-colors resize-none"
                />
              </div>
            </div>
          </Section>

          <Section title="weekly availability" description="recurring time windows you're free for sessions.">
            <AvailabilityPicker value={availability} onChange={setAvailability} />
          </Section>

          {error && (
            <Card className="p-3 border-red-500/20 bg-red-500/5">
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 text-red-400 flex-shrink-0" />
                <span className="text-red-300">{error}</span>
              </div>
            </Card>
          )}

          <div className="sticky bottom-4 z-10">
            <Card className="p-3 flex items-center justify-between gap-3 flex-wrap shadow-soft">
              <div className="text-sm text-zinc-400">
                {saved && (
                  <span className="inline-flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> saved
                  </span>
                )}
                {!saved && !isComplete && (
                  <span>fill in skills, topics, languages and availability to enable matching.</span>
                )}
                {!saved && isComplete && <span>profile is ready for matchmaking.</span>}
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? <><Spinner size="sm" /> saving</> : <><Save className="h-4 w-4" /> save</>}
                </Button>
                {isComplete && (
                  <Button type="button" variant="outline" onClick={() => nav("/home")}>
                    home <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </form>
      </Container>
    </div>
  );
}
