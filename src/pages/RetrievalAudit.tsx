import { useState, useCallback } from "react";
import { Search, Send, Loader2, Lightbulb } from "lucide-react";
import { ChunkViewer } from "@/components/ChunkViewer";
import { ScoreMeter } from "@/components/ScoreMeter";
import { CoverageHeatmap } from "@/components/CoverageHeatmap";
import { AuditAlerts } from "@/components/AuditAlerts";
import { MetricCard } from "@/components/MetricCard";
import { AnswerExtractionPanel } from "@/components/AnswerExtractionPanel";
import { useDocumentStore } from "@/stores/documentStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function RetrievalAudit() {
  const {
    fileName, rawText, chunks, isAuditing,
    auditQuery, auditResults,
    setIsAuditing, setAuditQuery, setAuditResults
  } = useDocumentStore();

  const [queryInput, setQueryInput] = useState("");

  const handleAudit = async () => {
    if (!queryInput.trim()) return;
    if (!rawText) {
      toast({ title: "No document loaded", description: "Please upload a document first in the Compression tab.", variant: "destructive" });
      return;
    }

    setAuditQuery(queryInput);
    setIsAuditing(true);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-document", {
        body: {
          action: "audit",
          query: queryInput,
          text: rawText.slice(0, 30000),
          chunks: chunks.slice(0, 20).map(c => ({ id: c.id, text: c.text })),
        },
      });

      if (error) throw error;
      setAuditResults(data);
    } catch (err: any) {
      console.error("Audit error:", err);
      toast({ title: "Audit failed", description: err.message, variant: "destructive" });
    } finally {
      setIsAuditing(false);
    }
  };

  const handleEvidenceClick = useCallback((chunkId: string) => {
    const el = document.querySelector(`[data-search-id="chunk-${chunkId}-0"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("search-flash");
      setTimeout(() => el.classList.remove("search-flash"), 1200);
    }
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          Retrieval Integrity Auditor
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Query your documents and audit retrieval quality
        </p>
      </div>

      {/* Query Input */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAudit()}
            placeholder={fileName ? `Ask a question about "${fileName}"...` : "Upload a document first..."}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            disabled={!rawText || isAuditing}
          />
        </div>
        <button
          onClick={handleAudit}
          disabled={!queryInput.trim() || !rawText || isAuditing}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Audit
        </button>
      </div>

      {!rawText && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-sm">Upload a document in the Compression tab first</p>
        </div>
      )}

      {isAuditing && (
        <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Running retrieval audit...</span>
        </div>
      )}

      {/* Audit Results */}
      {auditResults && !isAuditing && (
        <div className="space-y-6 animate-slide-up">
          {/* Score + Metrics + Answer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Score */}
            <div className="flex items-center justify-center p-6 rounded-xl border border-border bg-card shadow-card">
              <ScoreMeter score={auditResults.integrityScore} label="Integrity Score" size="lg" />
            </div>

            {/* Right: Metrics + Extracted Answer */}
            <div className="space-y-4 lg:col-span-2">
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  label="Retrieved Chunks"
                  value={auditResults.retrievedChunks.length}
                />
                <MetricCard
                  label="Relevant Chunks"
                  value={auditResults.retrievedChunks.filter(c => c.isRelevant).length}
                  trend="up"
                  change={`${((auditResults.retrievedChunks.filter(c => c.isRelevant).length / Math.max(auditResults.retrievedChunks.length, 1)) * 100).toFixed(0)}% precision`}
                />
              </div>

              {/* Extracted Answer Panel */}
              {auditResults.extractedAnswer && (
                <AnswerExtractionPanel
                  answer={auditResults.extractedAnswer}
                  onEvidenceClick={handleEvidenceClick}
                />
              )}
            </div>
          </div>

          {/* Grid: Chunks + Coverage + Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-card p-4">
              <ChunkViewer
                chunks={auditResults.retrievedChunks}
                title="Retrieved Chunks"
                showSimilarity
              />
            </div>
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-4">
                <CoverageHeatmap data={auditResults.coverageData} />
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <AuditAlerts alerts={auditResults.alerts} />
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {auditResults.suggestions.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-warning" />
                Improvement Suggestions
              </h3>
              <ul className="space-y-2">
                {auditResults.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-secondary-foreground flex items-start gap-2">
                    <span className="text-primary font-mono text-[10px] mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
