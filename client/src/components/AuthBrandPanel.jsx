import { Users, Video, Code2 } from "lucide-react";

const HIGHLIGHTS = [
  { icon: Users, label: "match by topic, level, and availability" },
  { icon: Video, label: "live video and voice, peer-to-peer" },
  { icon: Code2, label: "real-time collaborative editor" },
];

export default function AuthBrandPanel() {
  return (
    <div className="hidden lg:flex relative overflow-hidden border-l border-zinc-900">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at center, rgb(99 102 241 / 0.25), transparent 60%)",
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative flex flex-col justify-center px-10 xl:px-16 max-w-xl">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400 w-fit">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          live mock interviews
        </div>
        <h2 className="mt-6 text-3xl xl:text-4xl font-semibold tracking-tight leading-tight">
          practice the way you'll{" "}
          <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
            actually interview
          </span>
          .
        </h2>
        <p className="mt-4 text-zinc-400">
          peerprep matches you with another engineer at your level. share a real video call and a real editor. solve a real interview question together.
        </p>

        <ul className="mt-8 space-y-3">
          {HIGHLIGHTS.map((h) => (
            <li key={h.label} className="flex items-center gap-3 text-sm text-zinc-300">
              <span className="h-7 w-7 rounded-md bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center flex-shrink-0">
                <h.icon className="h-3.5 w-3.5" />
              </span>
              {h.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
