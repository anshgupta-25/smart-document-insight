import { useState } from "react";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SourceTextViewerProps {
  rawText: string;
  highlightText?: string;
}

export function SourceTextViewer({ rawText, highlightText }: SourceTextViewerProps) {
  const [expanded, setExpanded] = useState(true);

  const lines = rawText.split("\n");

  const getHighlightedLines = () => {
    if (!highlightText) return new Set<number>();
    const hlWords = highlightText.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const highlighted = new Set<number>();

    lines.forEach((line, i) => {
      const lower = line.toLowerCase();
      const matchCount = hlWords.filter(w => lower.includes(w)).length;
      if (matchCount >= Math.min(3, hlWords.length * 0.4)) {
        highlighted.add(i);
      }
    });

    return highlighted;
  };

  const highlightedLines = getHighlightedLines();

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Original Source Text
          </span>
          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {lines.length} lines
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="max-h-[400px] overflow-auto scrollbar-thin border-t border-border">
          <div className="p-4 font-mono text-xs leading-relaxed">
            {lines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3 py-0.5 px-1 rounded-sm transition-colors",
                  highlightedLines.has(i) && "bg-primary/10 border-l-2 border-primary"
                )}
              >
                <span className="text-muted-foreground/50 select-none w-8 text-right shrink-0">
                  {i + 1}
                </span>
                <span className={cn(
                  "text-secondary-foreground whitespace-pre-wrap break-all",
                  highlightedLines.has(i) && "text-foreground font-medium"
                )}>
                  {line || "\u00A0"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
