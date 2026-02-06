import { useState } from "react";
import { FileText, Download, Loader2, ShieldCheck } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { SummaryPanel } from "@/components/SummaryPanel";
import { ChunkViewer } from "@/components/ChunkViewer";
import { MetricCard } from "@/components/MetricCard";
import { TransparencyPanel } from "@/components/TransparencyPanel";
import { SourceTextViewer } from "@/components/SourceTextViewer";
import { useDocumentStore } from "@/stores/documentStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function DocumentCompression() {
  const {
    fileName, rawText, chunks, summaries, verificationStats, isProcessing, highlightText,
    setDocument, setChunks, setSummaries, setVerificationStats, setIsProcessing, setHighlightText
  } = useDocumentStore();
  const [activeTab, setActiveTab] = useState<"summary" | "chunks" | "json">("summary");

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);

    try {
      const text = await file.text();
      setDocument(file.name, text);

      const { data, error } = await supabase.functions.invoke("analyze-document", {
        body: { action: "compress", text: text.slice(0, 30000), fileName: file.name },
      });

      if (error) throw error;

      setChunks(data.chunks || []);
      setSummaries(data.summaries || []);
      setVerificationStats(data.verificationStats || null);
      toast({ title: "Document processed", description: `${data.chunks?.length || 0} chunks extracted — ${data.verificationStats?.verifiedFacts || 0} facts verified` });
    } catch (err: any) {
      console.error("Processing error:", err);
      toast({ title: "Processing failed", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
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
            Extraction-first document compression with fact verification
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

      {/* Upload area */}
      <FileUpload onFileSelect={handleFileUpload} isProcessing={isProcessing} />

      {/* Transparency Panel + Metrics */}
      {chunks.length > 0 && verificationStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <TransparencyPanel stats={verificationStats} />
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 content-start">
            <MetricCard label="Total Chunks" value={chunks.length} icon={<FileText className="w-5 h-5" />} />
            <MetricCard label="Summary Levels" value={summaries.length > 0 ? 3 : 0} />
            <MetricCard
              label="Entities Found"
              value={summaries.reduce((acc, s) => {
                const e = s.extractedEntities;
                return acc + (e ? e.numbers.length + e.dates.length + e.risks.length : 0);
              }, 0)}
            />
            <MetricCard
              label="Verified Facts"
              value={`${verificationStats.verifiedFacts}/${verificationStats.totalFacts}`}
              icon={<ShieldCheck className="w-5 h-5" />}
            />
          </div>
        </div>
      )}

      {/* Original Source Text Viewer */}
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
                {tab === "summary" ? "Verified Summaries" : tab === "chunks" ? "Chunks" : "JSON Output"}
              </button>
            ))}
          </div>

          <div className="animate-fade-in">
            {activeTab === "summary" && (
              <SummaryPanel
                sections={summaries}
                onHighlightSource={(text) => setHighlightText(text)}
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
          <span className="text-sm">Extracting and verifying document content...</span>
        </div>
      )}
    </div>
  );
}
