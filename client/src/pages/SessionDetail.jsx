import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { ArrowLeft, AlertCircle, BookOpen, Clock, Code2, Trophy } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import { Container, Card, Badge, Button, Skeleton } from "../components/ui";
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

const DIFF_TONE = {
  easy: "success",
  medium: "warning",
  hard: "danger",
};

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
        <Container size="md" className="py-16 text-center">
          <div className="mx-auto h-10 w-10 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-3">
            <AlertCircle className="h-5 w-5" />
          </div>
          <p className="text-red-300">{err}</p>
          <Link to="/sessions" className="inline-block mt-4">
            <Button variant="outline"><ArrowLeft className="h-4 w-4" /> back to sessions</Button>
          </Link>
        </Container>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <Navbar />
        <Container size="lg" className="py-12 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-96 w-full" />
        </Container>
      </div>
    );
  }

  const peer = session.participants.find((p) => !p.isMe);
  const monacoLang =
    LANGUAGES.find((l) => l.value === session.finalLanguage)?.monaco || "plaintext";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      <Container size="lg" className="py-8">
        <Link to="/sessions" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> back to sessions
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              session with {peer?.name || "unknown"}
            </h1>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Badge
                tone={
                  session.status === "completed"
                    ? "success"
                    : session.status === "active"
                    ? "info"
                    : "default"
                }
              >
                {session.status}
              </Badge>
              {typeof session.matchScore === "number" && (
                <Badge tone="brand">match score {(session.matchScore * 100).toFixed(0)}%</Badge>
              )}
            </div>
          </div>
          {session.status === "active" && (
            <Link to={`/session/${session.id}`}>
              <Button>rejoin session</Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
              <Clock className="h-3.5 w-3.5" /> duration
            </div>
            <div className="mt-1.5 text-xl font-semibold tabular-nums">
              {formatDuration(session.durationSeconds)}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
              <Code2 className="h-3.5 w-3.5" /> language
            </div>
            <div className="mt-1.5 text-xl font-semibold">
              {session.finalLanguage || "python"}
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
              <Trophy className="h-3.5 w-3.5" /> match score
            </div>
            <div className="mt-1.5 text-xl font-semibold tabular-nums">
              {typeof session.matchScore === "number" ? `${(session.matchScore * 100).toFixed(0)}%` : "—"}
            </div>
          </Card>
        </div>

        {question && (
          <Card className="p-5 mb-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500 mb-2">
              <BookOpen className="h-3.5 w-3.5" /> question attempted
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-zinc-100 font-medium">{question.title}</span>
              <Badge tone={DIFF_TONE[question.difficulty]}>{question.difficulty}</Badge>
              {question.topics.slice(0, 4).map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">{question.statement}</p>
          </Card>
        )}

        <Card className="overflow-hidden">
          <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-zinc-500">final code</span>
            <span className="text-xs text-zinc-500">read only</span>
          </div>
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
        </Card>
      </Container>
    </div>
  );
}
