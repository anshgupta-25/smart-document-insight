import { cn } from "@/lib/utils";

export interface ChunkData {
  id: string;
  text: string;
  similarity?: number;
  isRelevant?: boolean;
  isNoise?: boolean;
  sourceRef?: string;
  pageNumber?: number;
}

interface ChunkViewerProps {
  chunks: ChunkData[];
  title?: string;
  showSimilarity?: boolean;
}

export function ChunkViewer({ chunks, title = "Document Chunks", showSimilarity }: ChunkViewerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <span className="text-xs font-mono text-muted-foreground">{chunks.length} chunks</span>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-auto scrollbar-thin">
        {chunks.map((chunk, index) => (
          <div
            key={chunk.id}
            className={cn(
              "rounded-lg border p-3 transition-all duration-200 animate-fade-in",
              chunk.isNoise
                ? "border-destructive/30 bg-destructive/5"
                : chunk.isRelevant
                ? "border-success/30 bg-success/5"
                : "border-border bg-card"
            )}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                  #{index + 1}
                </span>
                {chunk.pageNumber && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    p.{chunk.pageNumber}
                  </span>
                )}
              </div>
              {showSimilarity && chunk.similarity !== undefined && (
                <span
                  className={cn(
                    "text-xs font-mono px-2 py-0.5 rounded-full",
                    chunk.similarity >= 0.8
                      ? "bg-success/20 text-success"
                      : chunk.similarity >= 0.5
                      ? "bg-warning/20 text-warning"
                      : "bg-destructive/20 text-destructive"
                  )}
                >
                  {(chunk.similarity * 100).toFixed(0)}%
                </span>
              )}
            </div>
            <p className="text-xs text-secondary-foreground leading-relaxed line-clamp-4">
              {chunk.text}
            </p>
            {chunk.sourceRef && (
              <p className="text-[10px] font-mono text-muted-foreground mt-2">
                {chunk.sourceRef}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
