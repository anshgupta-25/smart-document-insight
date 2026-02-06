import { cn } from "@/lib/utils";

interface CoverageHeatmapProps {
  data: { label: string; coverage: number }[];
}

export function CoverageHeatmap({ data }: CoverageHeatmapProps) {
  const getColor = (coverage: number) => {
    if (coverage >= 80) return "bg-success/80";
    if (coverage >= 60) return "bg-success/40";
    if (coverage >= 40) return "bg-warning/40";
    if (coverage >= 20) return "bg-warning/60";
    return "bg-destructive/40";
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Coverage Heatmap</h3>
      <div className="grid grid-cols-4 gap-1.5">
        {data.map((item, index) => (
          <div
            key={index}
            className={cn(
              "rounded-md p-2.5 text-center transition-all duration-300 hover:scale-105 cursor-default",
              getColor(item.coverage)
            )}
            title={`${item.label}: ${item.coverage}%`}
          >
            <p className="text-[10px] font-mono text-foreground/80 truncate">{item.label}</p>
            <p className="text-xs font-semibold font-mono text-foreground">{item.coverage}%</p>
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
