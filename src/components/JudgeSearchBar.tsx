import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search, X, ChevronUp, ChevronDown, FileText, AlertTriangle,
  Layers, Eye, Hash
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchMatch } from "@/hooks/useDocumentSearch";
import { HIGHLIGHT_COLORS } from "@/hooks/useDocumentSearch";

interface JudgeSearchBarProps {
  query: string;
  terms: string[];
  matches: SearchMatch[];
  totalMatches: number;
  activeIndex: number;
  activeMatch: SearchMatch | null;
  filteredSuggestions: string[];
  onQueryChange: (q: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onGoToIndex: (i: number) => void;
  onClose: () => void;
}

const sourceIcons: Record<string, React.ElementType> = {
  summary: Layers,
  evidence: Eye,
  chunk: FileText,
  alert: AlertTriangle,
  raw: Hash,
};

export function JudgeSearchBar({
  query,
  terms,
  matches,
  totalMatches,
  activeIndex,
  activeMatch,
  filteredSuggestions,
  onQueryChange,
  onNext,
  onPrev,
  onGoToIndex,
  onClose,
}: JudgeSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (e.metaKey || e.ctrlKey) {
          onPrev();
        } else {
          onNext();
        }
      } else if (e.key === "F3" || (e.key === "g" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        if (e.shiftKey) onPrev();
        else onNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onNext, onPrev]);

  // Scroll to active match element
  useEffect(() => {
    if (!activeMatch) return;
    const el = document.querySelector(`[data-search-id="${activeMatch.id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("search-flash");
      setTimeout(() => el.classList.remove("search-flash"), 1200);
    }
  }, [activeMatch, activeIndex]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      const newQuery = query ? `${query} ${suggestion}` : suggestion;
      onQueryChange(newQuery);
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
    [query, onQueryChange]
  );

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl px-4" ref={containerRef}>
      <div className="rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-xl shadow-elevated overflow-visible">
        {/* Search input row */}
        <div className="flex items-center gap-2 px-4 py-2.5">
          <Search className="w-4 h-4 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              onQueryChange(e.target.value);
              setShowSuggestions(e.target.value.length >= 2);
              setShowResults(false);
            }}
            onFocus={() => {
              if (query.length >= 2) setShowSuggestions(true);
            }}
            placeholder="Search facts, names, terms…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />

          {/* Match counter */}
          {terms.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-mono text-muted-foreground">
                {totalMatches > 0
                  ? `${activeIndex + 1}/${totalMatches}`
                  : "0 matches"}
              </span>
              <button
                onClick={() => { onPrev(); setShowSuggestions(false); }}
                disabled={totalMatches === 0}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                title="Previous match (Ctrl+Enter)"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { onNext(); setShowSuggestions(false); }}
                disabled={totalMatches === 0}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                title="Next match (Enter)"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowResults(!showResults)}
                disabled={totalMatches === 0}
                className={cn(
                  "p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30",
                  showResults && "bg-primary/10 text-primary"
                )}
                title="Show all results"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Term color chips */}
          {terms.length > 1 && (
            <div className="flex gap-1 shrink-0">
              {terms.map((t, i) => (
                <span
                  key={i}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length] }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Autocomplete suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="border-t border-border max-h-48 overflow-auto scrollbar-thin">
            {filteredSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s)}
                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent/50 transition-colors flex items-center gap-2"
              >
                <Search className="w-3 h-3 text-muted-foreground shrink-0" />
                <span
                  dangerouslySetInnerHTML={{
                    __html: highlightMatch(s, query),
                  }}
                />
              </button>
            ))}
          </div>
        )}

        {/* Results panel */}
        {showResults && matches.length > 0 && (
          <div className="border-t border-border max-h-64 overflow-auto scrollbar-thin">
            <div className="px-3 py-2 text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
              {totalMatches} matches across {new Set(matches.map(m => m.source)).size} sources
            </div>
            {matches.map((m, i) => {
              const Icon = sourceIcons[m.source] || FileText;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    onGoToIndex(i);
                    setShowResults(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 flex items-start gap-2.5 hover:bg-accent/50 transition-colors",
                    i === activeIndex && "bg-primary/10"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-primary">{m.sourceLabel}</span>
                      {m.pageNumber && (
                        <span className="text-[10px] font-mono text-muted-foreground">p.{m.pageNumber}</span>
                      )}
                      {m.confidence !== undefined && (
                        <span className="text-[10px] font-mono text-muted-foreground">{m.confidence}%</span>
                      )}
                    </div>
                    <p className="text-xs text-secondary-foreground line-clamp-1 mt-0.5">{m.text}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function highlightMatch(text: string, query: string): string {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(
    new RegExp(`(${escaped})`, "gi"),
    '<strong class="text-primary">$1</strong>'
  );
}
