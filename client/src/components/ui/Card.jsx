import { cn } from "./cn.js";

export default function Card({ className, interactive = false, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm",
        interactive && "transition-all duration-150 hover:border-zinc-700 hover:bg-zinc-900/60",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
