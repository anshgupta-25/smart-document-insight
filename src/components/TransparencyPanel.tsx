import { ShieldCheck, ShieldAlert, ShieldX, Activity, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VerificationStats {
  totalFacts: number;
  verifiedFacts: number;
  unverifiedFacts: number;
  conflictFacts: number;
  confidenceScore: number;
  hallucinationRisk: "low" | "medium" | "high";
}

interface TransparencyPanelProps {
  stats: VerificationStats;
}

export function TransparencyPanel({ stats }: TransparencyPanelProps) {
  const riskColors = {
    low: "text-success bg-success/10 border-success/30",
    medium: "text-warning bg-warning/10 border-warning/30",
    high: "text-destructive bg-destructive/10 border-destructive/30",
  };

  const riskIcons = {
    low: <ShieldCheck className="w-4 h-4" />,
    medium: <ShieldAlert className="w-4 h-4" />,
    high: <ShieldX className="w-4 h-4" />,
  };

  const riskLabels = {
    low: "Low Risk",
    medium: "Medium Risk",
    high: "High Risk",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Transparency & Trust</h3>
      </div>

      {/* Confidence Score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Extraction Confidence</span>
          <span className="text-sm font-mono font-semibold text-foreground">
            {stats.confidenceScore}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              stats.confidenceScore >= 80
                ? "bg-success"
                : stats.confidenceScore >= 50
                ? "bg-warning"
                : "bg-destructive"
            )}
            style={{ width: `${stats.confidenceScore}%` }}
          />
        </div>
      </div>

      {/* Fact Breakdown */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-success/10 border border-success/20 p-3 text-center">
          <div className="text-lg font-mono font-bold text-success">{stats.verifiedFacts}</div>
          <div className="text-[10px] text-success/80 flex items-center justify-center gap-1 mt-1">
            <ShieldCheck className="w-3 h-3" /> Verified
          </div>
        </div>
        <div className="rounded-lg bg-warning/10 border border-warning/20 p-3 text-center">
          <div className="text-lg font-mono font-bold text-warning">{stats.unverifiedFacts}</div>
          <div className="text-[10px] text-warning/80 flex items-center justify-center gap-1 mt-1">
            <ShieldAlert className="w-3 h-3" /> Unverified
          </div>
        </div>
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center">
          <div className="text-lg font-mono font-bold text-destructive">{stats.conflictFacts}</div>
          <div className="text-[10px] text-destructive/80 flex items-center justify-center gap-1 mt-1">
            <ShieldX className="w-3 h-3" /> Conflict
          </div>
        </div>
      </div>

      {/* Hallucination Risk */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2",
          riskColors[stats.hallucinationRisk]
        )}
      >
        {riskIcons[stats.hallucinationRisk]}
        <div className="flex-1">
          <span className="text-xs font-medium">Hallucination Risk</span>
        </div>
        <span className="text-xs font-mono font-semibold">
          {riskLabels[stats.hallucinationRisk]}
        </span>
      </div>

      {/* Verification Score */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Activity className="w-3 h-3" />
        <span>
          Verification Score: {stats.totalFacts > 0
            ? Math.round((stats.verifiedFacts / stats.totalFacts) * 100)
            : 0}% ({stats.verifiedFacts}/{stats.totalFacts} facts confirmed)
        </span>
      </div>
    </div>
  );
}
