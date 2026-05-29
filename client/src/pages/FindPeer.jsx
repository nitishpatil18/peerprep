import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { useMatchStore } from "../store/matchStore.js";

function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function FindPeer() {
  const { queueState, queueSize, error, loading, joinQueue, leaveQueue, fetchState } = useMatchStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    fetchState();
    const i = setInterval(fetchState, 5000);
    return () => clearInterval(i);
  }, [fetchState]);

  useEffect(() => {
    if (!queueState) {
      setElapsed(0);
      return;
    }
    const start = queueState.enqueuedAt;
    setElapsed(Date.now() - start);
    const t = setInterval(() => setElapsed(Date.now() - start), 1000);
    return () => clearInterval(t);
  }, [queueState]);

  const inQueue = queueState && queueState.status !== "completed";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-semibold">find a peer</h1>
        <p className="mt-2 text-zinc-400">
          we'll match you with someone working on similar topics at a similar level.
        </p>

        <div className="mt-8 p-6 border border-zinc-800 rounded bg-zinc-900/50">
          {!inQueue && (
            <div className="text-center">
              <p className="text-sm text-zinc-400 mb-4">
                {queueSize} {queueSize === 1 ? "person" : "people"} currently looking for a match.
              </p>
              <button
                onClick={joinQueue}
                disabled={loading}
                className="px-6 py-3 bg-zinc-100 text-zinc-900 rounded font-medium disabled:opacity-50"
              >
                {loading ? "joining..." : "start matching"}
              </button>
            </div>
          )}

          {inQueue && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-sm text-zinc-300">
                  {queueState.status === "proposed" ? "match found, see modal" : "searching for a peer"}
                </span>
              </div>
              <p className="text-3xl font-mono text-zinc-100">{formatElapsed(elapsed)}</p>
              <p className="text-xs text-zinc-500 mt-1">time in queue</p>
              <button
                onClick={leaveQueue}
                disabled={loading || queueState.status === "proposed"}
                className="mt-6 px-4 py-2 border border-zinc-700 rounded text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
              >
                cancel
              </button>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}
        </div>

        <div className="mt-6 text-xs text-zinc-500 space-y-1">
          <p>how matching works:</p>
          <p>• we score every waiting peer against you on topics, level, language, role, skills</p>
          <p>• best match above the threshold gets proposed to both of you</p>
          <p>• both must accept within 30 seconds to start a session</p>
        </div>
      </div>
    </div>
  );
}
