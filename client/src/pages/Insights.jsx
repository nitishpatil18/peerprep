import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Target, Brain, AlertCircle } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import { Container, Card, Badge, Button, Skeleton, EmptyState } from "../components/ui";
import { getMySkillRatings } from "../api/skills.js";
import { getRecommendations } from "../api/recommendations.js";

const DIFF_TONE = { easy: "success", medium: "warning", hard: "danger" };

function RatingBar({ rating }) {
  const pct = Math.max(0, Math.min(100, ((rating - 400) / 1600) * 100));
  const color =
    rating >= 1200 ? "bg-emerald-500"
    : rating >= 1000 ? "bg-brand-500"
    : rating >= 800 ? "bg-amber-500"
    : "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-zinc-300 w-12 text-right">{Math.round(rating)}</span>
    </div>
  );
}

function ratingLabel(rating) {
  if (rating >= 1400) return { label: "expert", tone: "success" };
  if (rating >= 1200) return { label: "strong", tone: "brand" };
  if (rating >= 1000) return { label: "solid", tone: "info" };
  if (rating >= 800) return { label: "developing", tone: "warning" };
  return { label: "weak", tone: "danger" };
}

export default function Insights() {
  const [ratings, setRatings] = useState(null);
  const [recs, setRecs] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    Promise.all([getMySkillRatings(), getRecommendations()])
      .then(([r, rec]) => {
        setRatings(r);
        setRecs(rec);
      })
      .catch((e) => setErr(e.response?.data?.error || "failed to load"));
  }, []);

  const weakTopics = ratings?.filter((r) => r.rating < 1000).sort((a, b) => a.rating - b.rating) || [];
  const strongTopics = ratings?.filter((r) => r.rating >= 1000).sort((a, b) => b.rating - a.rating) || [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <Container size="lg" className="py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">skill insights</h1>
          <p className="mt-1 text-sm text-zinc-400">
            ratings update after every session based on peer feedback and question difficulty.
          </p>
        </div>

        {err && (
          <Card className="p-4 border-red-500/20 bg-red-500/5 mb-6">
            <div className="flex items-center gap-2 text-sm text-red-300">
              <AlertCircle className="h-4 w-4" /> {err}
            </div>
          </Card>
        )}

        {ratings === null && !err && (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        )}

        {ratings && ratings.length === 0 && (
          <EmptyState
            icon={Brain}
            title="no skill data yet"
            description="complete a session, pick a question, and submit feedback. your skill ratings will appear here."
            action={<Link to="/find-peer"><Button>find a peer <ArrowRight className="h-4 w-4" /></Button></Link>}
          />
        )}

        {ratings && ratings.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-brand-400" />
                  <h2 className="font-medium">all topic ratings</h2>
                  <span className="text-xs text-zinc-500 ml-auto">{ratings.length} topics</span>
                </div>
                <div className="space-y-3">
                  {[...ratings].sort((a, b) => b.rating - a.rating).map((r) => {
                    const { label, tone } = ratingLabel(r.rating);
                    return (
                      <div key={r.topic}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-zinc-200">{r.topic}</span>
                            <Badge tone={tone}>{label}</Badge>
                          </div>
                          <span className="text-xs text-zinc-500">{r.gamesPlayed} sessions</span>
                        </div>
                        <RatingBar rating={r.rating} />
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-4 bg-zinc-900/30">
                <div className="text-xs text-zinc-500 space-y-1">
                  <p className="font-medium text-zinc-400 mb-2">how ratings work</p>
                  <p>starts at 1000. updates after each session using peer rating (1-5 stars) and difficulty feedback.</p>
                  <p>k-factor decays from 32 to 8 as confidence grows. below 1000 = weak area. above 1200 = strength.</p>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              {weakTopics.length > 0 && (
                <Card className="p-5 border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-amber-400" />
                    <h2 className="font-medium text-amber-200">weak areas to focus on</h2>
                  </div>
                  <div className="space-y-2">
                    {weakTopics.map((r) => (
                      <div key={r.topic} className="flex items-center justify-between">
                        <span className="text-sm text-zinc-200">{r.topic}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-amber-400">{Math.round(r.rating)}</span>
                          <span className="text-xs text-zinc-500">{r.gamesPlayed} sessions</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {strongTopics.length > 0 && (
                <Card className="p-5 border-emerald-500/20 bg-emerald-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <h2 className="font-medium text-emerald-200">strengths</h2>
                  </div>
                  <div className="space-y-2">
                    {strongTopics.slice(0, 5).map((r) => (
                      <div key={r.topic} className="flex items-center justify-between">
                        <span className="text-sm text-zinc-200">{r.topic}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-emerald-400">{Math.round(r.rating)}</span>
                          <span className="text-xs text-zinc-500">{r.gamesPlayed} sessions</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {recs && recs.recommendations.length > 0 && (
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-4 w-4 text-brand-400" />
                    <h2 className="font-medium">recommended next</h2>
                  </div>
                  <div className="space-y-2">
                    {recs.recommendations.slice(0, 3).map((r) => (
                      <div key={r.slug} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-sm text-zinc-200 truncate block">{r.title}</span>
                          <span className="text-xs text-zinc-500">{r.reasons?.[0]}</span>
                        </div>
                        <Badge tone={DIFF_TONE[r.difficulty]}>{r.difficulty}</Badge>
                      </div>
                    ))}
                  </div>
                  <Link to="/find-peer" className="mt-3 block">
                    <Button variant="outline" className="w-full text-sm">
                      practice these <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </Card>
              )}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
