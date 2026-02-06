import { Sparkles } from "lucide-react";

interface GhostModeSuggestionsProps {
  suggestions: string[];
  onSelect: (query: string) => void;
}

/**
 * Smart document-aware query suggestions card.
 * Shown when Ghost Mode opens with no active query.
 */
export function GhostModeSuggestions({ suggestions, onSelect }: GhostModeSuggestionsProps) {
  if (!suggestions.length) return null;

  return (
    <div className="fixed top-[68px] right-4 z-[59] w-full max-w-sm animate-fade-in">
      <div className="rounded-xl border border-border bg-card/98 backdrop-blur-xl shadow-card overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
            Suggested Queries
          </span>
        </div>
        <div className="p-1">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSelect(s)}
              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent/50 rounded-lg transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
