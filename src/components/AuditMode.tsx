import { useState, useEffect, useCallback } from "react";
import { Ghost } from "lucide-react";
import { AuditSearchBar } from "@/components/AuditSearchBar";
import { GhostModeSuggestions } from "@/components/GhostModeSuggestions";
import { useDocumentSearch } from "@/hooks/useDocumentSearch";
import { useDocumentStore } from "@/stores/documentStore";
import { useAuditSearch } from "@/hooks/useAuditSearch";

export function AuditMode() {
  const [isActive, setIsActive] = useState(false);
  const search = useDocumentSearch();
  const { setHighlightText } = useDocumentStore();
  const { setSearchTerms } = useAuditSearch();

  // Sync search terms to store for source text highlighting
  useEffect(() => {
    if (search.terms.length > 0) {
      setHighlightText(search.terms.join(" "));
      setSearchTerms(search.terms);
    } else {
      setHighlightText(null);
      setSearchTerms([]);
    }
  }, [search.terms, setHighlightText, setSearchTerms]);

  // Ctrl+F or Cmd+F opens search when ghost mode is active
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        search.setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isActive, search]);

  const handleClose = useCallback(() => {
    search.setOpen(false);
    search.setQuery("");
  }, [search]);

  const handleToggle = useCallback(() => {
    if (isActive) {
      handleClose();
      setIsActive(false);
    } else {
      setIsActive(true);
      search.setOpen(true);
    }
  }, [isActive, handleClose, search]);

  const handleSuggestionSelect = useCallback((query: string) => {
    search.setQuery(query);
  }, [search]);

  // Floating activation button
  if (!isActive) {
    return (
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-glow hover:shadow-elevated transition-all duration-300 animate-pulse-glow"
        title="Enable Ghost Mode (Ctrl+F)"
      >
        <Ghost className="w-4 h-4" />
        Ghost Mode
      </button>
    );
  }

  return (
    <>
      {/* Search bar */}
      <AuditSearchBar
        query={search.query}
        terms={search.terms}
        matches={search.matches}
        totalMatches={search.totalMatches}
        activeIndex={search.activeIndex}
        activeMatch={search.activeMatch}
        filteredSuggestions={search.filteredSuggestions}
        onQueryChange={search.setQuery}
        onNext={search.goToNext}
        onPrev={search.goToPrev}
        onGoToIndex={search.goToIndex}
        onClose={handleToggle}
      />

      {/* Smart suggestions when no query */}
      {!search.query && search.smartSuggestions.length > 0 && (
        <GhostModeSuggestions
          suggestions={search.smartSuggestions}
          onSelect={handleSuggestionSelect}
        />
      )}
    </>
  );
}
