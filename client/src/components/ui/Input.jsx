import { cn } from "./cn.js";

export default function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "w-full h-10 px-3 rounded-md",
        "bg-zinc-900/60 border border-zinc-800",
        "text-zinc-100 placeholder:text-zinc-500",
        "hover:border-zinc-700",
        "focus:border-brand-500 focus:bg-zinc-900",
        "focus-ring",
        "transition-colors duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}
