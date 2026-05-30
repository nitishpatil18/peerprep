import { cn } from "./cn.js";

const TONES = {
  default: "bg-zinc-800 text-zinc-300",
  brand: "bg-brand-500/10 text-brand-400 border border-brand-500/20",
  success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  danger: "bg-red-500/10 text-red-400 border border-red-500/20",
  info: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
};

export default function Badge({ tone = "default", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
