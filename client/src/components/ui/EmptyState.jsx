import { cn } from "./cn.js";

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center py-12 px-6",
        "rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
          <Icon className="h-5 w-5" />
        </div>
      )}
      {title && <p className="text-zinc-100 font-medium">{title}</p>}
      {description && <p className="mt-1 text-sm text-zinc-400 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
