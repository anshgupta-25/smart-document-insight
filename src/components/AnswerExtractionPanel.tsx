import { FileText, MapPin, ChevronRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AnswerField {
  key: string;
  value: string;
  sourceChunkId: string;
  pageNumber: number;
  lineRange: string;
  sourceQuote: string;
}

export interface ExtractedAnswer {
  fields: AnswerField[];
  summary: string;
  confidence: number;
  reasoningTrace: string;
}

interface AnswerExtractionPanelProps {
  answer: ExtractedAnswer;
  onEvidenceClick?: (chunkId: string) => void;
}

function ConfidenceBar({ value }: { value: number }) {
  const getColor = () => {
    if (value >= 80) return "bg-success";
    if (value >= 50) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", getColor())}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={cn(
        "text-xs font-mono font-semibold min-w-[36px] text-right",
        value >= 80 ? "text-success" : value >= 50 ? "text-warning" : "text-destructive"
      )}>
        {value}%
      </span>
    </div>
  );
}

export function AnswerExtractionPanel({ answer, onEvidenceClick }: AnswerExtractionPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-card animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Extracted Answer</h3>
        </div>
        <span className={cn(
          "text-[10px] font-mono px-2 py-0.5 rounded-full border",
          answer.confidence >= 80
            ? "bg-success/15 text-success border-success/30"
            : answer.confidence >= 50
            ? "bg-warning/15 text-warning border-warning/30"
            : "bg-destructive/15 text-destructive border-destructive/30"
        )}>
          Confidence
        </span>
      </div>

      {/* Confidence Bar */}
      <ConfidenceBar value={answer.confidence} />

      {/* Answer Fields */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2.5">
        {answer.fields.map((field, i) => (
          <div key={i} className="flex items-start gap-3 group">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider shrink-0">
                  {field.key}:
                </span>
                <span className="text-sm font-semibold text-foreground font-mono">
                  {field.value}
                </span>
              </div>
            </div>
            <button
              onClick={() => onEvidenceClick?.(field.sourceChunkId)}
              className="shrink-0 flex items-center gap-1 text-[10px] font-mono text-primary hover:text-primary/80 transition-colors opacity-60 group-hover:opacity-100"
              title={`Source: Page ${field.pageNumber}, ${field.lineRange}`}
            >
              <MapPin className="w-3 h-3" />
              <span>p.{field.pageNumber}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      {answer.summary && (
        <p className="text-xs text-secondary-foreground leading-relaxed">
          {answer.summary}
        </p>
      )}

      {/* Reasoning Trace */}
      <div className="rounded-lg border border-border bg-muted/20 p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <FileText className="w-3 h-3 text-primary" />
          <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Reasoning Trace</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed font-mono">
          {answer.reasoningTrace}
        </p>
      </div>

      {/* Evidence Sources */}
      {answer.fields.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Evidence Sources</span>
          <div className="space-y-1">
            {answer.fields.map((field, i) => (
              <button
                key={i}
                onClick={() => onEvidenceClick?.(field.sourceChunkId)}
                className="w-full text-left rounded-md border border-border/50 bg-card hover:bg-muted/40 p-2 transition-colors group"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-mono text-primary">
                    {field.key} → Page {field.pageNumber}, {field.lineRange}
                  </span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-[10px] text-muted-foreground font-mono truncate leading-relaxed">
                  "{field.sourceQuote}"
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
