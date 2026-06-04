import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Star, Check, AlertCircle, ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import { Container, Card, Button, Spinner } from "../components/ui";
import { fetchSession } from "../api/sessions.js";
import { submitFeedback, getMyFeedback } from "../api/feedback.js";

const DIFFICULTY = [
  { value: "too_easy", label: "too easy" },
  { value: "right", label: "just right" },
  { value: "too_hard", label: "too hard" },
];

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hover || value) >= n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="p-1 rounded transition-colors"
            aria-label={`${n} star`}
          >
            <Star
              className={`h-7 w-7 ${
                filled ? "fill-amber-400 text-amber-400" : "text-zinc-700"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function SessionFeedback() {
  const { sessionId } = useParams();
  const nav = useNavigate();
  const [session, setSession] = useState(null);
  const [existing, setExisting] = useState(null);
  const [peerRating, setPeerRating] = useState(0);
  const [difficulty, setDifficulty] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([fetchSession(sessionId), getMyFeedback(sessionId)])
      .then(([s, f]) => {
        setSession(s);
        if (f) {
          setExisting(f);
          setPeerRating(f.peerRating);
          setDifficulty(f.difficultyRating);
          setNotes(f.notes || "");
        }
      })
      .catch((e) => setErr(e.response?.data?.error || "failed to load"));
  }, [sessionId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (peerRating < 1) {
      setErr("please rate your peer");
      return;
    }
    if (!difficulty) {
      setErr("please rate the difficulty");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await submitFeedback(sessionId, {
        peerRating,
        difficultyRating: difficulty,
        notes,
      });
      setSaved(true);
      setTimeout(() => nav("/sessions"), 800);
    } catch (e) {
      setErr(e.response?.data?.error || "failed to submit");
      setBusy(false);
    }
  }

  function handleSkip() {
    nav("/sessions");
  }

  if (err && !session) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <Navbar />
        <Container size="md" className="py-12 text-center">
          <p className="text-red-400">{err}</p>
          <Link to="/sessions" className="inline-block mt-4 text-sm underline">
            back to sessions
          </Link>
        </Container>
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <Container size="md" className="py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            how was your session?
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            quick feedback helps us improve your future matches.
          </p>
        </div>

        {existing && (
          <Card className="p-3 mb-4 border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-2 text-sm text-emerald-300">
              <Check className="h-4 w-4" />
              you already gave feedback for this session. you can update it.
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="p-5">
            <p className="font-medium mb-1">how was {peer?.name || "your peer"}?</p>
            <p className="text-xs text-zinc-500 mb-4">
              were they engaged, respectful, helpful?
            </p>
            <StarRating value={peerRating} onChange={setPeerRating} />
          </Card>

          <Card className="p-5">
            <p className="font-medium mb-1">was the question difficulty right?</p>
            <p className="text-xs text-zinc-500 mb-4">
              we use this to tune your future recommendations.
            </p>
            <div className="flex gap-2 flex-wrap">
              {DIFFICULTY.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    difficulty === d.value
                      ? "bg-zinc-100 text-zinc-900"
                      : "border border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <p className="font-medium mb-1">notes (optional)</p>
            <p className="text-xs text-zinc-500 mb-3">private. peer never sees this.</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="what worked? what didn't?"
              className="w-full px-3 py-2 rounded-md bg-zinc-900/60 border border-zinc-800 text-zinc-100 hover:border-zinc-700 focus:border-brand-500 focus-ring transition-colors resize-none"
            />
          </Card>

          {err && (
            <Card className="p-3 border-red-500/20 bg-red-500/5">
              <div className="flex items-start gap-2 text-sm text-red-300">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                {err}
              </div>
            </Card>
          )}

          {saved && (
            <Card className="p-3 border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-2 text-sm text-emerald-300">
                <Check className="h-4 w-4" /> saved. redirecting...
              </div>
            </Card>
          )}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? <><Spinner size="sm" /> submitting</> : <>submit <ArrowRight className="h-4 w-4" /></>}
            </Button>
            <Button type="button" variant="ghost" onClick={handleSkip} disabled={busy}>
              skip for now
            </Button>
          </div>
        </form>
      </Container>
    </div>
  );
}
