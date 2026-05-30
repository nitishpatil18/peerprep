import { cn } from "./cn.js";

export default function Skeleton({ className }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-zinc-800/60",
        className
      )}
    />
  );
}
