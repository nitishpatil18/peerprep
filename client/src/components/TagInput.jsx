import { useState } from "react";

export default function TagInput({ value = [], onChange, suggestions = [], placeholder }) {
  const [input, setInput] = useState("");

  function addTag(tag) {
    const t = tag.trim().toLowerCase();
    if (!t) return;
    if (value.includes(t)) return;
    onChange([...value, t]);
    setInput("");
  }

  function removeTag(tag) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && value.length) {
      removeTag(value[value.length - 1]);
    }
  }

  const filtered = suggestions.filter(
    (s) => !value.includes(s) && s.includes(input.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded min-h-[44px]">
        {value.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 bg-zinc-800 text-zinc-200 rounded text-sm flex items-center gap-1"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-zinc-500 hover:text-zinc-200"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-zinc-100"
        />
      </div>
      {input && filtered.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {filtered.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="px-2 py-0.5 text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 rounded hover:bg-zinc-800"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
