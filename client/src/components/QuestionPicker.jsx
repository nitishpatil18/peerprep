import { useEffect, useMemo, useState } from "react";
import { listQuestions, fetchTopics } from "../api/questions.js";

const DIFFICULTIES = ["", "easy", "medium", "hard"];

export default function QuestionPicker({ open, onClose, onPick }) {
  const [topics, setTopics] = useState([]);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchTopics().then(setTopics).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listQuestions({ q, difficulty, topic, limit: 50 })
      .then(setItems)
      .finally(() => setLoading(false));
  }, [open, q, difficulty, topic]);

  const grouped = useMemo(() => {
    return {
      easy: items.filter((i) => i.difficulty === "easy"),
      medium: items.filter((i) => i.difficulty === "medium"),
      hard: items.filter((i) => i.difficulty === "hard"),
    };
  }, [items]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-zinc-100">pick a question</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100">close</button>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="search..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1 min-w-[160px] px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-sm"
            />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-sm"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d || "any"} value={d}>{d || "any difficulty"}</option>
              ))}
            </select>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-sm"
            >
              <option value="">any topic</option>
              {topics.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading && <p className="p-4 text-sm text-zinc-500">loading...</p>}
          {!loading && items.length === 0 && (
            <p className="p-4 text-sm text-zinc-500">no questions match these filters.</p>
          )}
          {!loading && items.length > 0 && (
            <>
              {["easy", "medium", "hard"].map((d) =>
                grouped[d].length === 0 ? null : (
                  <div key={d} className="mb-3">
                    <div className="px-2 py-1 text-xs uppercase tracking-wide text-zinc-500">
                      {d} ({grouped[d].length})
                    </div>
                    <ul>
                      {grouped[d].map((item) => (
                        <li key={item.id}>
                          <button
                            onClick={() => onPick(item.slug)}
                            className="w-full text-left px-3 py-2 hover:bg-zinc-800 rounded flex items-center justify-between gap-2"
                          >
                            <span className="text-zinc-100 text-sm">{item.title}</span>
                            <span className="text-xs text-zinc-500 truncate max-w-[180px]">
                              {item.topics.slice(0, 3).join(", ")}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
