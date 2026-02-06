import { useState } from "react";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocumentStore } from "@/stores/documentStore";
import { SearchHighlight } from "@/components/SearchHighlight";

interface SourceTextViewerProps {
  rawText: string;
  highlightText?: string;
  searchTerms?: string[];
}

export function SourceTextViewer({ rawText, highlightText, searchTerms = [] }: SourceTextViewerProps) {
  const [expanded, setExpanded] = useState(true);

  const lines = rawText.split("\n");

  const getHighlightedLines = () => {
    if (!highlightText && searchTerms.length === 0) return new Set<number>();
    
    const highlighted = new Set<number>();

    // Search term highlighting
    if (searchTerms.length > 0) {
      lines.forEach((line, i) => {
        const lower = line.toLowerCase();
        if (searchTerms.some(t => lower.includes(t))) {
          highlighted.add(i);
        }
      });
    }

    // Original highlight text logic
    if (highlightText && searchTerms.length === 0) {
      const hlWords = highlightText.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      lines.forEach((line, i) => {
        const lower = line.toLowerCase();
        const matchCount = hlWords.filter(w => lower.includes(w)).length;
        if (matchCount >= Math.min(3, hlWords.length * 0.4)) {
          highlighted.add(i);
        }
      });
    }

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
                data-search-id={`raw-${i}-0`}
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
                  {searchTerms.length > 0 ? (
                    <SearchHighlight text={line || "\u00A0"} terms={searchTerms} />
                  ) : (
                    line || "\u00A0"
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
