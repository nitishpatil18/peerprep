import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Editor from "@monaco-editor/react";
import { fetchSession } from "../api/sessions.js";
import { fetchQuestion } from "../api/questions.js";
import { LANGUAGES } from "../utils/codeTemplates.js";

function formatDuration(secs) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export default function SessionDetail() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetchSession(sessionId)
      .then((s) => {
        setSession(s);
        if (s.finalQuestionSlug) {
          fetchQuestion(s.finalQuestionSlug).then(setQuestion).catch(() => {});
        }
      })
      .catch((e) => setErr(e.response?.data?.error || "failed to load"));
  }, [sessionId]);

  if (err) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-red-400">{err}</p>
          <Link to="/sessions" className="inline-block mt-4 text-sm underline">
            back to sessions
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        loading...
      </div>
    );
  }

  const peer = session.participants.find((p) => !p.isMe);
  const monacoLang =
    LANGUAGES.find((l) => l.value === session.finalLanguage)?.monaco || "plaintext";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link to="/sessions" className="text-sm text-zinc-400 underline">← back</Link>
        <h1 className="text-2xl font-semibold mt-3">
          session with {peer?.name || "unknown"}
        </h1>
        <div className="mt-2 text-sm text-zinc-400 flex flex-wrap gap-3">
          <span>status: <span className="text-zinc-200">{session.status}</span></span>
          <span>duration: <span className="text-zinc-200">{formatDuration(session.durationSeconds)}</span></span>
          <span>language: <span className="text-zinc-200">{session.finalLanguage || "python"}</span></span>
          {typeof session.matchScore === "number" && (
            <span>match score: <span className="text-zinc-200">{(session.matchScore * 100).toFixed(0)}%</span></span>
          )}
        </div>

        {session.status === "active" && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-sm">
            this session is still active.{" "}
            <Link to={`/session/${session.id}`} className="underline text-blue-300">
              rejoin
            </Link>
          </div>
        )}

        {question && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-zinc-300 mb-2">question attempted</h2>
            <div className="p-4 border border-zinc-800 rounded bg-zinc-900">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-zinc-100 font-medium">{question.title}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {question.difficulty}
                </span>
                {question.topics.slice(0, 3).map((t) => (
                  <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-sm text-zinc-400">{question.statement}</p>
            </div>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-sm font-medium text-zinc-300 mb-2">final code</h2>
          <div className="border border-zinc-800 rounded overflow-hidden">
            <Editor
              height="500px"
              language={monacoLang}
              theme="vs-dark"
              value={session.finalCode || "// no code captured"}
              options={{
                readOnly: true,
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
