import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, History, Sparkles, AlertCircle } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import { Container, Card, Button, Badge, Skeleton, EmptyState } from "../components/ui";

import { listSessions } from "../api/sessions.js";

function formatDuration(secs) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

const FILTERS = [
  { value: "all", label: "all" },
  { value: "completed", label: "completed" },
  { value: "active", label: "active" },
  { value: "cancelled", label: "cancelled" },
];

export default function Sessions() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    listSessions()
      .then(setItems)
      .catch((e) => setErr(e.response?.data?.error || "failed to load"));
  }, []);

  const filtered = items?.filter((s) => filter === "all" || s.status === filter) || [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      <Container size="lg" className="py-8 md:py-12">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">sessions</h1>
            <p className="mt-1 text-sm text-zinc-400">
              your past and active mock interviews. last 50, newest first.
            </p>
          </div>
          <Link to="/find-peer">
            <Button>start a new session <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>

        {items && items.length > 0 && (
          <div className="mb-4 flex items-center gap-1.5 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  filter === f.value
                    ? "bg-zinc-100 text-zinc-900"
                    : "border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
                }`}
              >
                {f.label}
                {f.value !== "all" && (
                  <span className="ml-1.5 text-zinc-500">
                    {items.filter((s) => s.status === f.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {err && (
          <Card className="p-4 border-red-500/20 bg-red-500/5">
            <div className="flex items-start gap-3 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 text-red-400 flex-shrink-0" />
              <span className="text-red-300">{err}</span>
            </div>
          </Card>
        )}

        {items === null && !err && (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}

        {items && items.length === 0 && (
          <EmptyState
            icon={Sparkles}
            title="no sessions yet"
            description="match with a peer to run your first mock interview. your history will appear here."
            action={
              <Link to="/find-peer">
                <Button>find a peer</Button>
              </Link>
            }
          />
        )}

        {items && items.length > 0 && filtered.length === 0 && (
          <EmptyState
            icon={History}
            title={`no ${filter} sessions`}
            description="try a different filter."
          />
        )}

        {filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((s) => (
              <Link key={s.id} to={`/sessions/${s.id}`} className="block">
                <Card interactive className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
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
                      {typeof s.matchScore === "number" && (
                        <span>match {(s.matchScore * 100).toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-600 flex-shrink-0" />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
