import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({ label, value, change, trend, icon, className }: MetricCardProps) {
  return (
    <div className={cn(
      "rounded-xl border border-border bg-card p-5 shadow-card animate-slide-up",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-semibold text-foreground font-mono">{value}</p>
          {change && (
            <p className={cn(
              "text-xs mt-1 font-mono",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive",
              trend === "neutral" && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/50 text-accent-foreground">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
