import { useState } from "react";
import { DAYS } from "../utils/constants.js";

function minutesToHHMM(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function HHMMtoMinutes(s) {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

export default function AvailabilityPicker({ value = [], onChange }) {
  const [day, setDay] = useState(1);
  const [start, setStart] = useState("19:00");
  const [end, setEnd] = useState("21:00");

  function addSlot() {
    const startMinute = HHMMtoMinutes(start);
    const endMinute = HHMMtoMinutes(end);
    if (endMinute <= startMinute) return;
    onChange([...value, { dayOfWeek: day, startMinute, endMinute }]);
  }

  function removeSlot(idx) {
    onChange(value.filter((_, i) => i !== idx));
  }

  const sorted = [...value]
    .map((s, i) => ({ ...s, _idx: i }))
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startMinute - b.startMinute);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-xs text-zinc-500 block mb-1">day</label>
          <select
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm"
          >
            {DAYS.map((d, i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">start</label>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">end</label>
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm"
          />
        </div>
        <button
          type="button"
          onClick={addSlot}
          className="px-3 py-1.5 bg-zinc-100 text-zinc-900 rounded text-sm font-medium"
        >
          add slot
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-zinc-500">no availability added yet.</p>
      ) : (
        <ul className="space-y-1">
          {sorted.map((s) => (
            <li
              key={s._idx}
              className="flex items-center justify-between px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm"
            >
              <span>
                <span className="text-zinc-400 mr-2">{DAYS[s.dayOfWeek]}</span>
                {minutesToHHMM(s.startMinute)} – {minutesToHHMM(s.endMinute)}
              </span>
              <button
                type="button"
                onClick={() => removeSlot(s._idx)}
                className="text-zinc-500 hover:text-red-400 text-xs"
              >
                remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
