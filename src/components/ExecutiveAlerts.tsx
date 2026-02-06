import { useState } from "react";
import {
  AlertTriangle, Clock, DollarSign, Shield, ChevronDown, ChevronRight,
  Zap, TrendingDown, FileWarning, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExecutiveAlert {
  id: string;
  category: "deadline" | "risk" | "financial" | "policy" | "critical";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  evidence: string;
  recommendation?: string;
}

interface ExecutiveAlertsProps {
  alerts: ExecutiveAlert[];
}

const categoryConfig = {
  deadline: {
    icon: Clock,
    label: "Deadline",
    color: "text-warning",
    bg: "bg-warning/10 border-warning/30",
  },
  risk: {
    icon: AlertTriangle,
    label: "Risk",
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/30",
  },
  financial: {
    icon: DollarSign,
    label: "Financial",
    color: "text-info",
    bg: "bg-info/10 border-info/30",
  },
  policy: {
    icon: Shield,
    label: "Policy",
    color: "text-warning",
    bg: "bg-warning/10 border-warning/30",
  },
  critical: {
    icon: Zap,
    label: "Critical",
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/30",
  },
};

const severityBadge = {
  high: "bg-destructive/20 text-destructive border-destructive/40",
  medium: "bg-warning/20 text-warning border-warning/40",
  low: "bg-info/20 text-info border-info/40",
};

function AlertCard({ alert }: { alert: ExecutiveAlert }) {
  const [expanded, setExpanded] = useState(false);
  const config = categoryConfig[alert.category];
  const Icon = config.icon;

  return (
    <div
      data-search-id={`alert-${alert.id}-0`}
      className={cn(
        "rounded-lg border p-3.5 transition-all duration-200 animate-slide-up cursor-pointer hover:shadow-card",
        config.bg
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 shrink-0", config.color)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cn("text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border", severityBadge[alert.severity])}>
              {alert.severity}
            </span>
            <span className="text-[10px] font-mono uppercase text-muted-foreground">
              {config.label}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground">{alert.title}</p>
          <p className="text-xs text-secondary-foreground mt-1 leading-relaxed">{alert.description}</p>

          {expanded && (
            <div className="mt-3 space-y-2 animate-fade-in">
              <div className="rounded-md bg-muted/50 p-2.5 text-xs font-mono text-muted-foreground leading-relaxed border border-border">
                <span className="text-[10px] uppercase tracking-wider text-primary block mb-1">Evidence</span>
                {alert.evidence}
              </div>
              {alert.recommendation && (
                <div className="flex items-start gap-2 text-xs text-success">
                  <Zap className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{alert.recommendation}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </div>
    </div>
  );
}

export function ExecutiveAlerts({ alerts }: ExecutiveAlertsProps) {
  if (alerts.length === 0) return null;

  const highCount = alerts.filter((a) => a.severity === "high").length;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Executive Alerts</h3>
        </div>
        <div className="flex items-center gap-2">
          {highCount > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-destructive/20 text-destructive border border-destructive/30 animate-pulse-glow">
              {highCount} critical
            </span>
          )}
          <span className="text-[10px] font-mono text-muted-foreground">{alerts.length} total</span>
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-auto scrollbar-thin">
        {alerts
          .sort((a, b) => {
            const order = { high: 0, medium: 1, low: 2 };
            return order[a.severity] - order[b.severity];
          })
          .map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
      </div>
    </div>
  );
}
