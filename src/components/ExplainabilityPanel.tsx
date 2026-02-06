import { Brain, Lightbulb, Target, BarChart3, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface AIDecision {
  id: string;
  action: string;
  reason: string;
  evidence: string;
  confidence: number;
}

interface ExplainabilityPanelProps {
  decisions: AIDecision[];
}

function DecisionCard({ decision }: { decision: AIDecision }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-lg border border-border bg-muted/30 p-3 cursor-pointer hover:bg-muted/50 transition-all duration-200"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-2.5">
        <Brain className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-medium text-foreground">{decision.action}</p>
            <span
              className={cn(
                "text-[10px] font-mono px-1.5 py-0.5 rounded",
                decision.confidence >= 80
                  ? "bg-success/15 text-success"
                  : decision.confidence >= 50
                  ? "bg-warning/15 text-warning"
                  : "bg-destructive/15 text-destructive"
              )}
            >
              {decision.confidence}%
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">{decision.reason}</p>

          {expanded && (
            <div className="mt-2 rounded-md bg-card p-2 text-xs font-mono text-muted-foreground border border-border animate-fade-in">
              <span className="text-[10px] uppercase tracking-wider text-primary block mb-1">Evidence</span>
              {decision.evidence}
            </div>
          )}
        </div>
        <div className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </div>
      </div>
    </div>
  );
}

export function ExplainabilityPanel({ decisions }: ExplainabilityPanelProps) {
  if (decisions.length === 0) return null;

  const avgConfidence = Math.round(decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">AI Explainability</h3>
        </div>
        <span
          className={cn(
            "text-[10px] font-mono px-2 py-0.5 rounded-full border",
            avgConfidence >= 80
              ? "bg-success/15 text-success border-success/30"
              : avgConfidence >= 50
              ? "bg-warning/15 text-warning border-warning/30"
              : "bg-destructive/15 text-destructive border-destructive/30"
          )}
        >
          Avg {avgConfidence}% confidence
        </span>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-auto scrollbar-thin">
        {decisions.map((d) => (
          <DecisionCard key={d.id} decision={d} />
        ))}
      </div>
    </div>
  );
}
