import { cn } from "@/lib/utils";
import { useState } from "react";

export interface CoverageItem {
  label: string;
  coverage: number;
  tokenOverlap?: number;
  semanticScore?: number;
  spanCoverage?: number;
}

interface CoverageHeatmapProps {
  data: CoverageItem[];
}

function CoverageTooltip({ item }: { item: CoverageItem }) {
  const hasDetails = item.tokenOverlap !== undefined;
  if (!hasDetails) return null;

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 w-48 rounded-lg border border-border bg-card p-3 shadow-elevated text-left animate-fade-in pointer-events-none">
      <p className="text-[11px] font-semibold text-foreground mb-2">{item.label}</p>
      <div className="space-y-1.5">
        <MetricRow label="Token Overlap" value={item.tokenOverlap!} />
        <MetricRow label="Semantic Score" value={item.semanticScore!} />
        <MetricRow label="Span Coverage" value={item.spanCoverage!} />
      </div>
      <div className="mt-2 pt-2 border-t border-border">
        <MetricRow label="Overall" value={item.coverage} bold />
      </div>
    </div>
  );
}

function MetricRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  const getBarColor = (v: number) => {
    if (v >= 80) return "bg-success";
    if (v >= 50) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className={cn("text-[10px] text-muted-foreground", bold && "font-semibold text-foreground")}>{label}</span>
        <span className={cn("text-[10px] font-mono", bold ? "font-bold text-foreground" : "text-muted-foreground")}>{value}%</span>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", getBarColor(value))}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function CoverageHeatmap({ data }: CoverageHeatmapProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getColor = (coverage: number) => {
    if (coverage >= 80) return "bg-success/80";
    if (coverage >= 60) return "bg-success/40";
    if (coverage >= 40) return "bg-warning/40";
    if (coverage >= 20) return "bg-warning/60";
    return "bg-destructive/40";
  };

  const avgCoverage = data.length > 0
    ? Math.round(data.reduce((sum, d) => sum + d.coverage, 0) / data.length)
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Coverage Heatmap</h3>
        <span className={cn(
          "text-[10px] font-mono px-2 py-0.5 rounded-full border",
          avgCoverage >= 70
            ? "bg-success/15 text-success border-success/30"
            : avgCoverage >= 40
            ? "bg-warning/15 text-warning border-warning/30"
            : "bg-destructive/15 text-destructive border-destructive/30"
        )}>
          Avg {avgCoverage}%
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {data.map((item, index) => (
          <div
            key={index}
            className="relative"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {hoveredIndex === index && <CoverageTooltip item={item} />}
            <div
              className={cn(
                "rounded-md p-2.5 text-center transition-all duration-300 hover:scale-105 cursor-default",
                getColor(item.coverage)
              )}
            >
              <p className="text-[10px] font-mono text-foreground/80 truncate">{item.label}</p>
              <p className="text-xs font-semibold font-mono text-foreground">{item.coverage}%</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-destructive/40" />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-warning/40" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-success/80" />
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
