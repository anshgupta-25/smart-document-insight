import { useState } from "react";
import { FileText, Download, Loader2, ShieldCheck, Layers, BarChart3 } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { SummaryPanel, type SummaryViewLevel } from "@/components/SummaryPanel";
import { ChunkViewer } from "@/components/ChunkViewer";
import { MetricCard } from "@/components/MetricCard";
import { TransparencyPanel } from "@/components/TransparencyPanel";
import { SourceTextViewer } from "@/components/SourceTextViewer";
import { ExtractionStatusBanner } from "@/components/ExtractionStatus";
import { useDocumentStore } from "@/stores/documentStore";
import { extractDocumentText, type ExtractionResult } from "@/lib/pdfExtractor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function DocumentCompression() {
  const {
    fileName, rawText, chunks, summaries, verificationStats, isProcessing, highlightText,
    setDocument, setChunks, setSummaries, setVerificationStats, setIsProcessing, setHighlightText
  } = useDocumentStore();
  const [activeTab, setActiveTab] = useState<"summary" | "chunks" | "json">("summary");
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [summaryViewLevel, setSummaryViewLevel] = useState<SummaryViewLevel>("detailed");

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setExtractionResult(null);
    setLastFile(file);

    try {
      const result = await extractDocumentText(file);
      setExtractionResult(result);

      if (result.status === "failed" || !result.text.trim()) {
        toast({ title: "Extraction failed", description: "Could not extract readable text. Please try a different file.", variant: "destructive" });
        setIsProcessing(false);
        return;
      }

      if (result.status === "ocr-needed") {
        toast({ title: "Limited extraction", description: "Only partial text could be extracted. Results may be incomplete.", variant: "destructive" });
      }

      setDocument(file.name, result.text);

      const { data, error } = await supabase.functions.invoke("analyze-document", {
        body: { action: "compress", text: result.text.slice(0, 30000), fileName: file.name },
      });

      if (error) throw error;

      setChunks(data.chunks || []);
      setSummaries(data.summaries || []);
      setVerificationStats(data.verificationStats || null);
      toast({
        title: "Document compressed",
        description: `${data.summaries?.length || 0} summary levels — ${data.verificationStats?.verifiedFacts || 0} facts verified`,
      });
    } catch (err: any) {
      console.error("Processing error:", err);
      toast({ title: "Processing failed", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReExtract = () => {
    if (lastFile) processFile(lastFile);
  };

  const handleExportJSON = () => {
    const exported = { fileName, summaries, chunks, verificationStats, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName || "document"}-compressed.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Compression Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Multi-level hierarchical compression with fact verification
          </p>
        </div>
        {summaries.length > 0 && (
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        )}
      </div>

      <FileUpload onFileSelect={processFile} isProcessing={isProcessing} />

      {extractionResult && (
        <ExtractionStatusBanner
          status={extractionResult.status}
          pageCount={extractionResult.pageCount}
          warnings={extractionResult.warnings}
          onReExtract={handleReExtract}
        />
      )}

      {/* Transparency Panel + Metrics */}
      {chunks.length > 0 && verificationStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <TransparencyPanel stats={verificationStats} />
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 content-start">
            <MetricCard label="Total Chunks" value={chunks.length} icon={<FileText className="w-5 h-5" />} />
            <MetricCard
              label="Compression"
              value={`${verificationStats.compressionRatio ?? 0}%`}
              icon={<BarChart3 className="w-5 h-5" />}
            />
            <MetricCard
              label="Abstraction"
              value={verificationStats.abstractionLevel
                ? verificationStats.abstractionLevel.charAt(0).toUpperCase() + verificationStats.abstractionLevel.slice(1)
                : "—"}
              icon={<Layers className="w-5 h-5" />}
            />
            <MetricCard
              label="Verified Facts"
              value={`${verificationStats.verifiedFacts}/${verificationStats.totalFacts}`}
              icon={<ShieldCheck className="w-5 h-5" />}
            />
          </div>
        </div>
      )}

      {/* Extracted Text Preview */}
      {rawText && chunks.length > 0 && (
        <SourceTextViewer rawText={rawText} highlightText={highlightText || undefined} />
      )}

      {/* Content tabs */}
      {chunks.length > 0 && (
        <>
          <div className="flex gap-1 border-b border-border">
            {(["summary", "chunks", "json"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "summary" ? "Verified Summaries" : tab === "chunks" ? "Raw Chunks" : "JSON Output"}
              </button>
            ))}
          </div>

          <div className="animate-fade-in">
            {activeTab === "summary" && (
              <SummaryPanel
                sections={summaries}
                onHighlightSource={(text) => setHighlightText(text)}
                viewLevel={summaryViewLevel}
                onViewLevelChange={setSummaryViewLevel}
              />
            )}
            {activeTab === "chunks" && <ChunkViewer chunks={chunks} title="Document Chunks" />}
            {activeTab === "json" && (
              <pre className="rounded-xl bg-card border border-border p-4 text-xs font-mono text-secondary-foreground overflow-auto max-h-[500px] scrollbar-thin">
                {JSON.stringify({ fileName, summaries, chunks, verificationStats }, null, 2)}
              </pre>
            )}
          </div>
        </>
      )}

      {isProcessing && (
        <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Extracting, compressing, and verifying document content...</span>
        </div>
      )}
    </div>
  );
}
