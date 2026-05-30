import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { fetchQuestion } from "../api/questions.js";

const DIFF_COLORS = {
  easy: "text-green-400 bg-green-500/10",
  medium: "text-yellow-400 bg-yellow-500/10",
  hard: "text-red-400 bg-red-500/10",
};

export default function QuestionPanel({ slug, onChange }) {
  const [question, setQuestion] = useState(null);
  const [showHints, setShowHints] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setQuestion(null);
    setErr(null);
    setShowHints(false);
    if (!slug) return;
    fetchQuestion(slug)
      .then(setQuestion)
      .catch((e) => setErr(e.response?.data?.error || "failed to load question"));
  }, [slug]);

  if (!slug) {
    return (
      <div className="border border-zinc-800 rounded p-6 bg-zinc-900 text-center">
        <p className="text-zinc-400 text-sm mb-3">no question selected</p>
        <button
          onClick={onChange}
          className="px-3 py-1.5 bg-zinc-100 text-zinc-900 rounded text-sm font-medium"
        >
          pick a question
        </button>
      </div>
    );
  }

  if (err) {
    return (
      <div className="border border-zinc-800 rounded p-4 bg-zinc-900">
        <p className="text-red-400 text-sm">{err}</p>
        <button onClick={onChange} className="mt-2 text-xs underline text-zinc-300">
          pick a different question
        </button>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="border border-zinc-800 rounded p-4 bg-zinc-900 text-zinc-500 text-sm">
        loading question...
      </div>
    );
  }

  return (
    <div className="border border-zinc-800 rounded bg-zinc-900 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-zinc-100 font-medium">{question.title}</h2>
          <span className={`text-xs px-1.5 py-0.5 rounded ${DIFF_COLORS[question.difficulty]}`}>
            {question.difficulty}
          </span>
          {question.topics.slice(0, 3).map((t) => (
            <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
              {t}
            </span>
          ))}
        </div>
        <button onClick={onChange} className="text-xs text-zinc-400 hover:text-zinc-100 underline">
          change
        </button>
      </div>

      <div className="p-4 max-h-[400px] overflow-y-auto text-sm text-zinc-200 leading-relaxed space-y-3">
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{question.statement}</ReactMarkdown>
        </div>

        {question.examples?.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">examples</div>
            <div className="space-y-2">
              {question.examples.map((ex, i) => (
                <div key={i} className="bg-zinc-950 border border-zinc-800 rounded p-2 text-xs font-mono">
                  <div><span className="text-zinc-500">input:</span> {ex.input}</div>
                  <div><span className="text-zinc-500">output:</span> {ex.output}</div>
                  {ex.explanation && (
                    <div className="text-zinc-400 mt-1 font-sans">{ex.explanation}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {question.constraints?.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">constraints</div>
            <ul className="text-xs text-zinc-400 list-disc pl-5 space-y-0.5">
              {question.constraints.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}

        {question.hints?.length > 0 && (
          <div>
            <button
              onClick={() => setShowHints((v) => !v)}
              className="text-xs text-zinc-400 underline"
            >
              {showHints ? "hide hints" : `show hints (${question.hints.length})`}
            </button>
            {showHints && (
              <ul className="mt-2 text-xs text-zinc-300 list-disc pl-5 space-y-1">
                {question.hints.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
