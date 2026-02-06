import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useDocumentStore } from "@/stores/documentStore";
import type { SummarySection } from "@/components/SummaryPanel";

export interface SearchMatch {
  id: string;
  text: string;
  context: string;
  source: "summary" | "evidence" | "chunk" | "alert" | "raw";
  sourceLabel: string;
  pageNumber?: number;
  confidence?: number;
  lineNumber?: number;
  termIndex: number; // which search term matched
}

interface SearchState {
  query: string;
  terms: string[];
  matches: SearchMatch[];
  activeIndex: number;
  isOpen: boolean;
}

function extractTextFromSections(sections: SummarySection[], results: SearchMatch[], terms: string[]) {
  for (const section of sections) {
    // Search summary text
    for (let ti = 0; ti < terms.length; ti++) {
      const term = terms[ti];
      if (section.summary.toLowerCase().includes(term)) {
        results.push({
          id: `summary-${section.id}-${ti}`,
          text: section.summary,
          context: section.title,
          source: "summary",
          sourceLabel: section.level === "document" ? "Executive Summary" : `Section: ${section.title}`,
          termIndex: ti,
        });
        break; // one match per section per term
      }
    }
    // Search evidence
    if (section.evidence) {
      for (let ti = 0; ti < terms.length; ti++) {
        if (section.evidence.toLowerCase().includes(terms[ti])) {
          results.push({
            id: `evidence-${section.id}-${ti}`,
            text: section.evidence,
            context: section.title,
            source: "evidence",
            sourceLabel: `Evidence: ${section.title}`,
            confidence: section.verificationStatus === "verified" ? 95 : section.verificationStatus === "conflict" ? 30 : 60,
            termIndex: ti,
          });
          break;
        }
      }
    }
    if (section.children) {
      extractTextFromSections(section.children, results, terms);
    }
  }
}

function buildSuggestions(
  summaries: SummarySection[],
  chunks: { text: string; pageNumber?: number }[],
  rawText: string | null,
  alerts: { title: string; description: string }[]
): string[] {
  const entities = new Set<string>();

  // Extract capitalized words (likely names, orgs)
  const allText = [
    ...summaries.map(s => s.summary),
    ...summaries.flatMap(s => s.evidence ? [s.evidence] : []),
    ...chunks.map(c => c.text),
    ...alerts.map(a => `${a.title} ${a.description}`),
    rawText || "",
  ].join(" ");

  // Named entities: capitalized words 2+ chars, not common words
  const commonWords = new Set(["The", "This", "That", "With", "From", "Into", "About", "After", "Before", "Where", "When", "Which", "Their", "There", "These", "Those", "Would", "Could", "Should", "Have", "Been", "Will", "Does", "Each", "Every", "Some", "Other", "More", "Most", "Such", "Only", "Very", "Also", "Just", "Than", "Then", "Over", "Under", "Between"]);
  const nameRegex = /\b[A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})*\b/g;
  let match;
  while ((match = nameRegex.exec(allText)) !== null) {
    const word = match[0];
    if (!commonWords.has(word) && word.length > 2) {
      entities.add(word);
    }
  }

  // Dates
  const dateRegex = /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi;
  while ((match = dateRegex.exec(allText)) !== null) {
    entities.add(match[0]);
  }

  // Amounts
  const amountRegex = /\$[\d,.]+|\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g;
  while ((match = amountRegex.exec(allText)) !== null) {
    entities.add(match[0]);
  }

  return Array.from(entities).slice(0, 200);
}

export function useDocumentSearch() {
  const { summaries, chunks, rawText, executiveAlerts } = useDocumentStore();

  const [state, setState] = useState<SearchState>({
    query: "",
    terms: [],
    matches: [],
    activeIndex: 0,
    isOpen: false,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Pre-build suggestion index
  const suggestions = useMemo(
    () => buildSuggestions(summaries, chunks, rawText, executiveAlerts),
    [summaries, chunks, rawText, executiveAlerts]
  );

  const search = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setState(s => ({ ...s, query, terms: [], matches: [], activeIndex: 0 }));
        return;
      }

      const terms = query.toLowerCase().split(/\s+/).filter(t => t.length >= 2);
      if (terms.length === 0) {
        setState(s => ({ ...s, query, terms: [], matches: [], activeIndex: 0 }));
        return;
      }

      const matches: SearchMatch[] = [];

      // 1. Search summaries & evidence
      extractTextFromSections(summaries, matches, terms);

      // 2. Search executive alerts
      for (const alert of executiveAlerts) {
        for (let ti = 0; ti < terms.length; ti++) {
          if (
            alert.title.toLowerCase().includes(terms[ti]) ||
            alert.description.toLowerCase().includes(terms[ti])
          ) {
            matches.push({
              id: `alert-${alert.id}-${ti}`,
              text: alert.title,
              context: alert.description,
              source: "alert",
              sourceLabel: `Alert: ${alert.category}`,
              termIndex: ti,
            });
            break;
          }
        }
      }

      // 3. Search chunks
      for (const chunk of chunks) {
        for (let ti = 0; ti < terms.length; ti++) {
          if (chunk.text.toLowerCase().includes(terms[ti])) {
            matches.push({
              id: `chunk-${chunk.id}-${ti}`,
              text: chunk.text,
              context: chunk.sourceRef || `Chunk`,
              source: "chunk",
              sourceLabel: chunk.sourceRef || `Chunk`,
              pageNumber: chunk.pageNumber,
              termIndex: ti,
            });
            break;
          }
        }
      }

      // 4. Search raw text lines
      if (rawText) {
        const lines = rawText.split("\n");
        let rawMatchCount = 0;
        for (let i = 0; i < lines.length && rawMatchCount < 50; i++) {
          const lower = lines[i].toLowerCase();
          for (let ti = 0; ti < terms.length; ti++) {
            if (lower.includes(terms[ti])) {
              matches.push({
                id: `raw-${i}-${ti}`,
                text: lines[i],
                context: `Line ${i + 1}`,
                source: "raw",
                sourceLabel: `Source Line ${i + 1}`,
                lineNumber: i + 1,
                termIndex: ti,
              });
              rawMatchCount++;
              break;
            }
          }
        }
      }

      // Deduplicate by id
      const seen = new Set<string>();
      const unique = matches.filter(m => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });

      setState(s => ({ ...s, query, terms, matches: unique, activeIndex: 0 }));
    },
    [summaries, chunks, rawText, executiveAlerts]
  );

  const setQuery = useCallback(
    (query: string) => {
      setState(s => ({ ...s, query }));
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => search(query), 80);
    },
    [search]
  );

  const setOpen = useCallback((isOpen: boolean) => {
    setState(s => ({ ...s, isOpen }));
  }, []);

  const goToNext = useCallback(() => {
    setState(s => ({
      ...s,
      activeIndex: s.matches.length > 0 ? (s.activeIndex + 1) % s.matches.length : 0,
    }));
  }, []);

  const goToPrev = useCallback(() => {
    setState(s => ({
      ...s,
      activeIndex: s.matches.length > 0 ? (s.activeIndex - 1 + s.matches.length) % s.matches.length : 0,
    }));
  }, []);

  const goToIndex = useCallback((index: number) => {
    setState(s => ({ ...s, activeIndex: index }));
  }, []);

  const filteredSuggestions = useMemo(() => {
    if (!state.query || state.query.length < 2) return [];
    const q = state.query.toLowerCase();
    return suggestions
      .filter(s => s.toLowerCase().includes(q))
      .slice(0, 8);
  }, [state.query, suggestions]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    ...state,
    setQuery,
    setOpen,
    goToNext,
    goToPrev,
    goToIndex,
    filteredSuggestions,
    totalMatches: state.matches.length,
    activeMatch: state.matches[state.activeIndex] || null,
  };
}

// Highlight colors for multi-term support
export const HIGHLIGHT_COLORS = [
  "rgba(255, 230, 100, 0.7)",
  "rgba(100, 210, 255, 0.5)",
  "rgba(180, 255, 150, 0.5)",
  "rgba(255, 180, 220, 0.5)",
  "rgba(200, 180, 255, 0.5)",
];

export function highlightTermsInText(text: string, terms: string[]): React.ReactNode[] {
  if (!terms.length) return [text];

  // Build a regex that matches any term
  const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) => {
    const termIdx = terms.findIndex(t => part.toLowerCase() === t.toLowerCase());
    if (termIdx >= 0) {
      return `<mark data-term="${termIdx}" style="background:${HIGHLIGHT_COLORS[termIdx % HIGHLIGHT_COLORS.length]};border-radius:3px;padding:1px 2px">${part}</mark>`;
    }
    return part;
  });
}
