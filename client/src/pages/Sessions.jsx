import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
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
  return date.toLocaleString();
}

export default function Sessions() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    listSessions()
      .then(setItems)
      .catch((e) => setErr(e.response?.data?.error || "failed to load"));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold">your sessions</h1>
        <p className="mt-1 text-sm text-zinc-400">
          last 50 mock interviews, newest first.
        </p>

        {err && <p className="mt-4 text-red-400 text-sm">{err}</p>}

        {!items && !err && (
          <p className="mt-6 text-zinc-500 text-sm">loading...</p>
        )}

        {items && items.length === 0 && (
          <p className="mt-6 text-zinc-500 text-sm">
            no sessions yet. <Link to="/find-peer" className="text-zinc-200 underline">find a peer</Link>.
          </p>
        )}

        {items && items.length > 0 && (
          <ul className="mt-6 space-y-2">
            {items.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/sessions/${s.id}`}
                  className="block p-4 border border-zinc-800 rounded hover:bg-zinc-900"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="text-zinc-100 font-medium">
                        with {s.peer?.name || "unknown"}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {formatDate(s.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`px-2 py-0.5 rounded ${
                        s.status === "completed"
                          ? "bg-green-500/10 text-green-400"
                          : s.status === "cancelled"
                            ? "bg-zinc-800 text-zinc-400"
                            : "bg-blue-500/10 text-blue-400"
                      }`}>
                        {s.status}
                      </span>
                      <span className="text-zinc-400">
                        {formatDuration(s.durationSeconds)}
                      </span>
                      <span className="text-zinc-500">
                        {s.finalLanguage || "python"}
                      </span>
                      {typeof s.matchScore === "number" && (
                        <span className="text-zinc-500">
                          score {(s.matchScore * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
