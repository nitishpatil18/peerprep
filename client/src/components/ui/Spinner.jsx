import { cn } from "./cn.js";

export default function Spinner({ size = "md", className }) {
  const sizes = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" };
  return (
    <span
      className={cn(
        "inline-block rounded-full border-2 border-zinc-700 border-t-zinc-100 animate-spin",
        sizes[size],
        className
      )}
    />
  );
}
