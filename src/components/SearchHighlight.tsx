import React from "react";
import { HIGHLIGHT_COLORS } from "@/hooks/useDocumentSearch";

interface SearchHighlightProps {
  text: string;
  terms: string[];
  className?: string;
}

/**
 * Renders text with marker-style highlighted search terms.
 * Uses a real-highlighter underline effect for a professional audit look.
 */
export function SearchHighlight({ text, terms, className }: SearchHighlightProps) {
  if (!terms.length || !text) {
    return <span className={className}>{text}</span>;
  }

  const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const termIdx = terms.findIndex(
          t => part.toLowerCase() === t.toLowerCase()
        );
        if (termIdx >= 0) {
          const color = HIGHLIGHT_COLORS[termIdx % HIGHLIGHT_COLORS.length];
          return (
            <mark
              key={i}
              className="search-highlight"
              style={{
                background: `linear-gradient(transparent 60%, ${color} 60%)`,
                borderRadius: "2px",
                padding: "0 2px",
                color: "inherit",
              }}
            >
              {part}
            </mark>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
}
