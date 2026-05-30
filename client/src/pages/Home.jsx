import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Users, History, UserCircle, Sparkles, AlertCircle } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import { Container, Card, Button, Badge, Skeleton, EmptyState } from "../components/ui";
import { useAuthStore } from "../store/authStore.js";
import { useProfileStore } from "../store/profileStore.js";
import { listSessions } from "../api/sessions.js";

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function formatDuration(secs) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export default function Home() {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const [sessions, setSessions] = useState(null);

  useEffect(() => {
    listSessions().then(setSessions).catch(() => setSessions([]));
  }, []);

  const completedSessions = sessions?.filter((s) => s.status === "completed") || [];
  const totalMinutes = completedSessions.reduce(
    (acc, s) => acc + Math.floor((s.durationSeconds || 0) / 60),
    0
  );
  const recent = sessions?.slice(0, 5) || [];

  const profileIncomplete = profile && !profile.isComplete;
  const firstName = user?.name?.split(" ")[0] || user?.name || "there";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      <Container size="xl" className="py-8 md:py-12">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              hi {firstName}
            </h1>
            <p className="mt-1 text-zinc-400 text-sm">
              {profileIncomplete
                ? "complete your profile to start matching."
                : "ready when you are. find a peer and get to work."}
            </p>
          </div>
          {!profileIncomplete && (
            <Link to="/find-peer">
              <Button size="lg">
                find a peer <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {profileIncomplete && (
          <Card className="p-5 mb-8 border-amber-500/20 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-zinc-100">finish your profile</p>
                <p className="text-sm text-zinc-400 mt-1">
                  add your target role, skills, topics to practice, and your weekly availability. takes 2 minutes.
                </p>
              </div>
              <Link to="/profile">
                <Button variant="outline">complete profile</Button>
              </Link>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-5">
            <div className="text-xs uppercase tracking-wide text-zinc-500">sessions</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">
              {sessions === null ? <Skeleton className="h-8 w-12" /> : completedSessions.length}
            </div>
            <div className="mt-1 text-xs text-zinc-500">completed mock interviews</div>
          </Card>
          <Card className="p-5">
            <div className="text-xs uppercase tracking-wide text-zinc-500">practice time</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">
              {sessions === null ? <Skeleton className="h-8 w-16" /> : `${totalMinutes}m`}
            </div>
            <div className="mt-1 text-xs text-zinc-500">total time in sessions</div>
          </Card>
          <Card className="p-5">
            <div className="text-xs uppercase tracking-wide text-zinc-500">target</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">
              {profile?.targetRole ? profile.targetRole.toUpperCase() : "—"}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {profile?.experienceLevel || "set your level in profile"}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">recent sessions</h2>
              {recent.length > 0 && (
                <Link to="/sessions" className="text-xs text-zinc-400 hover:text-zinc-100">
                  view all →
                </Link>
              )}
            </div>

            {sessions === null && (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            )}

            {sessions && recent.length === 0 && (
              <EmptyState
                icon={Sparkles}
                title="no sessions yet"
                description="get matched with a peer and run your first mock interview."
                action={
                  !profileIncomplete && (
                    <Link to="/find-peer">
                      <Button>find a peer</Button>
                    </Link>
                  )
                }
              />
            )}

            {sessions && recent.length > 0 && (
              <div className="space-y-2">
                {recent.map((s) => (
                  <Link
                    key={s.id}
                    to={`/sessions/${s.id}`}
                    className="block"
                  >
                    <Card interactive className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-100 truncate">
                            with {s.peer?.name || "unknown"}
                          </span>
                          <Badge
                            tone={
                              s.status === "completed"
                                ? "success"
                                : s.status === "active"
                                ? "info"
                                : "default"
                            }
                          >
                            {s.status}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-zinc-500 flex flex-wrap gap-x-3 gap-y-0.5">
                          <span>{formatDate(s.createdAt)}</span>
                          <span>{formatDuration(s.durationSeconds)}</span>
                          <span>{s.finalLanguage || "python"}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-zinc-600 flex-shrink-0" />
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-medium mb-3">quick links</h2>
            <div className="space-y-2">
              <Link to="/find-peer" className="block">
                <Card interactive className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-md bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">find a peer</div>
                      <div className="text-xs text-zinc-500">start matching</div>
                    </div>
                  </div>
                </Card>
              </Link>
              <Link to="/sessions" className="block">
                <Card interactive className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-md bg-zinc-800 text-zinc-300 flex items-center justify-center">
                      <History className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">sessions</div>
                      <div className="text-xs text-zinc-500">past interviews</div>
                    </div>
                  </div>
                </Card>
              </Link>
              <Link to="/profile" className="block">
                <Card interactive className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-md bg-zinc-800 text-zinc-300 flex items-center justify-center">
                      <UserCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">profile</div>
                      <div className="text-xs text-zinc-500">role, skills, schedule</div>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
