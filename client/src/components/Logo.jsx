import { Link } from "react-router-dom";
import { cn } from "./ui/cn.js";

export default function Logo({ className, to = "/" }) {
  const inner = (
    <span className={cn("inline-flex items-center gap-2 font-semibold text-zinc-100", className)}>
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-400 to-brand-600 text-white text-sm font-bold shadow-glow-brand">
        p
      </span>
      <span className="tracking-tight">peerprep</span>
    </span>
  );
  if (!to) return inner;
  return <Link to={to}>{inner}</Link>;
}
