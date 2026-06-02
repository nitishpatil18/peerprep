import { Code2, Pencil } from "lucide-react";
import { cn } from "./ui/cn.js";

export default function SessionTabs({ active, onChange }) {
  const tabs = [
    { value: "code", label: "code", icon: Code2 },
    { value: "whiteboard", label: "whiteboard", icon: Pencil },
  ];

  return (
    <div className="inline-flex items-center p-0.5 bg-zinc-900 border border-zinc-800 rounded-md">
      {tabs.map((t) => {
        const isActive = active === t.value;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors",
              isActive
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
