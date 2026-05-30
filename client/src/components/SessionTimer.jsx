import { useEffect, useState } from "react";

function formatHMS(secs) {
  if (!secs || secs < 0) secs = 0;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function SessionTimer({ startedAt }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!startedAt) return null;
  const elapsed = Math.floor((now - new Date(startedAt).getTime()) / 1000);

  return (
    <span className="font-mono text-zinc-200">{formatHMS(elapsed)}</span>
  );
}
