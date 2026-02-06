import { useState, useEffect, useCallback } from "react";
import { Shield, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuditSearchBar } from "@/components/AuditSearchBar";
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

  // Ctrl+F or Cmd+F opens search when audit mode is active
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
      // Deactivate: close search and clear
      handleClose();
      setIsActive(false);
    } else {
      // Activate: open search bar immediately
      setIsActive(true);
      search.setOpen(true);
    }
  }, [isActive, handleClose, search]);

  // Floating activation button
  if (!isActive) {
    return (
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-glow hover:shadow-elevated transition-all duration-300 animate-pulse-glow"
        title="Enable Audit Mode (Ctrl+F)"
      >
        <Shield className="w-4 h-4" />
        Audit Mode
      </button>
    );
  }

  return (
    <>
      {/* Search bar — always visible when audit mode is active */}
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
    </>
  );
}
