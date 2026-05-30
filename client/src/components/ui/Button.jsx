import { cn } from "./cn.js";

const VARIANTS = {
  primary:
    "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-500/40 disabled:cursor-not-allowed",
  secondary:
    "bg-zinc-100 text-zinc-900 hover:bg-white active:bg-zinc-200 disabled:bg-zinc-100/30 disabled:cursor-not-allowed",
  outline:
    "border border-zinc-800 text-zinc-200 hover:bg-zinc-900 hover:border-zinc-700 active:bg-zinc-900/80 disabled:opacity-40 disabled:cursor-not-allowed",
  ghost:
    "text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed",
  danger:
    "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 disabled:bg-red-500/40 disabled:cursor-not-allowed",
};

const SIZES = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium",
        "transition-colors duration-150",
        "focus-ring",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
