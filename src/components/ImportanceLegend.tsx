import { Star, Circle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type ImportanceLevel = "critical" | "important" | "supporting";

export interface ImportanceItem {
  level: ImportanceLevel;
  score: number;
  reason: string;
}

const levelConfig = {
  critical: {
    icon: Star,
    label: "Critical",
    color: "text-warning",
    bg: "bg-warning/10 border-warning/30",
    dot: "bg-warning",
    description: "Key decisions, risks, deadlines, financial figures",
  },
  important: {
    icon: Circle,
    label: "Important",
    color: "text-info",
    bg: "bg-info/10 border-info/30",
    dot: "bg-info",
    description: "Supporting facts, context, requirements",
  },
  supporting: {
    icon: Minus,
    label: "Supporting",
    color: "text-muted-foreground",
    bg: "bg-muted border-border",
    dot: "bg-muted-foreground",
    description: "Background details, references",
  },
};

interface ImportanceLegendProps {
  filter?: ImportanceLevel | null;
  onFilterChange?: (level: ImportanceLevel | null) => void;
}

export function ImportanceLegend({ filter, onFilterChange }: ImportanceLegendProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Importance:</span>
      {(Object.entries(levelConfig) as [ImportanceLevel, typeof levelConfig.critical][]).map(([level, config]) => (
        <button
          key={level}
          onClick={() => onFilterChange?.(filter === level ? null : level)}
          className={cn(
            "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border transition-all duration-200",
            filter === level
              ? cn(config.bg, config.color, "ring-1 ring-current")
              : filter === null || filter === undefined
              ? cn(config.bg, config.color, "opacity-80")
              : "bg-muted/30 text-muted-foreground/50 border-transparent"
          )}
        >
          <div className={cn("w-2 h-2 rounded-full shrink-0", config.dot)} />
          {config.label}
        </button>
      ))}
    </div>
  );
}

export function ImportanceBadge({ level, score, reason }: ImportanceItem) {
  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <div className={cn("inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border", config.bg, config.color)}>
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
      <span className="opacity-60">({score})</span>
    </div>
  );
}

export { levelConfig };
