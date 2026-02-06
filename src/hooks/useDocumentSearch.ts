import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useDocumentStore } from "@/stores/documentStore";
import type { SummarySection } from "@/components/SummaryPanel";

// ── Stopwords to filter out from search queries ──
const STOPWORDS = new Set([
  "what", "is", "the", "of", "a", "an", "to", "for", "in", "on", "it", "its",
  "this", "that", "are", "was", "were", "be", "been", "being", "have", "has",
  "had", "do", "does", "did", "will", "would", "could", "should", "may",
  "might", "shall", "can", "with", "from", "into", "about", "after", "before",
  "where", "when", "which", "their", "there", "these", "those", "than", "then",
  "over", "under", "between", "how", "who", "whom", "why", "not", "no", "nor",
  "but", "or", "and", "if", "so", "at", "by", "up", "out", "off", "each",
  "every", "some", "any", "all", "most", "other", "more", "much", "many",
  "also", "just", "very", "only", "such", "my", "your", "our", "his", "her",
]);

// ── Entity extraction patterns ──
const ENTITY_PATTERNS = [
  { label: "flight_number", regex: /\b[A-Z]{2}-?\d{3,5}\b/g },
  { label: "pnr", regex: /\b[A-Z0-9]{6}\b/g },
  { label: "date", regex: /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi },
  { label: "amount", regex: /\$[\d,.]+|\₹[\d,.]+|\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g },
  { label: "email", regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi },
  { label: "phone", regex: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g },
  { label: "order_id", regex: /\b(?:ORD|ORDER|INV|REF)[-#]?\d{4,}\b/gi },
];

export interface SearchMatch {
  id: string;
  text: string;
  context: string;
  source: "summary" | "evidence" | "chunk" | "alert" | "raw";
  sourceLabel: string;
  pageNumber?: number;
  confidence?: number;
  lineNumber?: number;
  termIndex: number;
}

interface SearchState {
  query: string;
  terms: string[];
  matches: SearchMatch[];
  activeIndex: number;
  isOpen: boolean;
}

/** Extract meaningful terms by removing stopwords */
function extractSearchTerms(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/).filter(t => t.length >= 2);
  const meaningful = words.filter(w => !STOPWORDS.has(w));
  // If ALL words are stopwords, fall back to original words
  return meaningful.length > 0 ? meaningful : words;
}

/** Extract named entities from text using regex patterns */
function extractEntities(text: string): Map<string, Set<string>> {
  const entities = new Map<string, Set<string>>();
  for (const { label, regex } of ENTITY_PATTERNS) {
    const copy = new RegExp(regex.source, regex.flags);
    let match;
    while ((match = copy.exec(text)) !== null) {
      if (!entities.has(label)) entities.set(label, new Set());
      entities.get(label)!.add(match[0]);
    }
  }
  return entities;
}

function extractTextFromSections(sections: SummarySection[], results: SearchMatch[], terms: string[]) {
  for (const section of sections) {
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
        break;
      }
    }
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

  const allText = [
    ...summaries.map(s => s.summary),
    ...summaries.flatMap(s => s.evidence ? [s.evidence] : []),
    ...chunks.map(c => c.text),
    ...alerts.map(a => `${a.title} ${a.description}`),
    rawText || "",
  ].join(" ");

  // Named entities via regex
  for (const { regex } of ENTITY_PATTERNS) {
    const copy = new RegExp(regex.source, regex.flags);
    let match;
    while ((match = copy.exec(allText)) !== null) {
      entities.add(match[0]);
    }
  }

  // Capitalized multi-word names
  const commonWords = new Set(["The", "This", "That", "With", "From", "Into", "About", "After", "Before", "Where", "When", "Which", "Their", "There", "These", "Those", "Would", "Could", "Should", "Have", "Been", "Will", "Does", "Each", "Every", "Some", "Other", "More", "Most", "Such", "Only", "Very", "Also", "Just", "Than", "Then", "Over", "Under", "Between"]);
  const nameRegex = /\b[A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})*\b/g;
  let match;
  while ((match = nameRegex.exec(allText)) !== null) {
    const word = match[0];
    if (!commonWords.has(word) && word.length > 2) {
      entities.add(word);
    }
  }

  return Array.from(entities).slice(0, 200);
}

/** Generate smart document-aware query suggestions */
function generateSmartSuggestions(
  summaries: SummarySection[],
  chunks: { text: string }[],
  rawText: string | null,
): string[] {
  const suggestions: string[] = [];
  const allText = [
    ...summaries.map(s => s.summary),
    ...chunks.map(c => c.text),
    rawText || "",
  ].join(" ");

  // Detect document type and suggest accordingly
  const lower = allText.toLowerCase();

  // Travel documents
  if (/flight|airline|boarding|itinerary|pnr|airport/.test(lower)) {
    suggestions.push("What is the flight number?", "What is the travel date?", "What is the PNR?");
  }
  // Resumes
  if (/resume|curriculum|experience|education|skills|achievements/.test(lower)) {
    suggestions.push("What are the main skills?", "Education details?", "Top achievements?");
  }
  // Financial
  if (/invoice|payment|amount|total|tax|refund|balance/.test(lower)) {
    suggestions.push("What is the total amount?", "Refund policy?", "Payment terms?");
  }
  // Legal/contracts
  if (/agreement|contract|party|clause|termination|liability/.test(lower)) {
    suggestions.push("Key contract terms?", "Termination clause?", "Liability limits?");
  }
  // Generic fallback
  if (suggestions.length === 0) {
    // Use section headers as suggestions
    for (const s of summaries.slice(0, 3)) {
      if (s.title && s.title !== "Document Summary") {
        suggestions.push(`What about ${s.title}?`);
      }
    }
  }

  return suggestions.slice(0, 3);
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

  // Smart document-aware query suggestions
  const smartSuggestions = useMemo(
    () => generateSmartSuggestions(summaries, chunks, rawText),
    [summaries, chunks, rawText]
  );

  const search = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setState(s => ({ ...s, query, terms: [], matches: [], activeIndex: 0 }));
        return;
      }

      // Use stopword-filtered terms
      const terms = extractSearchTerms(query);
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

      // Deduplicate
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
    smartSuggestions,
    totalMatches: state.matches.length,
    activeMatch: state.matches[state.activeIndex] || null,
  };
}

// Highlight colors for multi-term support
export const HIGHLIGHT_COLORS = [
  "rgba(255, 240, 120, 0.7)",
  "rgba(100, 220, 210, 0.45)",
  "rgba(180, 255, 150, 0.5)",
  "rgba(255, 180, 220, 0.5)",
  "rgba(200, 180, 255, 0.5)",
];

export function highlightTermsInText(text: string, terms: string[]): React.ReactNode[] {
  if (!terms.length) return [text];

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
