import { CheckCircle2, AlertTriangle, XCircle, FileText, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExtractionStatus as Status } from "@/lib/pdfExtractor";

interface ExtractionStatusProps {
  status: Status;
  pageCount: number;
  warnings: string[];
  onReExtract?: () => void;
}

export function ExtractionStatusBanner({ status, pageCount, warnings, onReExtract }: ExtractionStatusProps) {
  const config = {
    success: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      label: "Extraction Successful",
      className: "bg-success/10 border-success/30 text-success",
    },
    "ocr-needed": {
      icon: <AlertTriangle className="w-4 h-4" />,
      label: "Needs OCR — Limited Text Extracted",
      className: "bg-warning/10 border-warning/30 text-warning",
    },
    failed: {
      icon: <XCircle className="w-4 h-4" />,
      label: "Extraction Failed",
      className: "bg-destructive/10 border-destructive/30 text-destructive",
    },
  };

  const c = config[status];

  return (
    <div className={cn("rounded-xl border p-4 space-y-2", c.className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {c.icon}
          <span className="text-sm font-semibold">{c.label}</span>
          {pageCount > 0 && (
            <span className="text-[10px] font-mono opacity-70 bg-background/20 px-2 py-0.5 rounded">
              {pageCount} page{pageCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {onReExtract && (
          <button
            onClick={onReExtract}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-background/30 hover:bg-background/50 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Re-extract
          </button>
        )}
      </div>

      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((w, i) => (
            <p key={i} className="text-xs opacity-80 flex items-start gap-1.5">
              <FileText className="w-3 h-3 shrink-0 mt-0.5" />
              {w}
            </p>
          ))}
        </div>
      )}

      {status === "failed" && (
        <p className="text-xs font-medium mt-1">
          ⚠️ Document parsing failed. Please re-upload or use a text-based format.
        </p>
      )}
    </div>
  );
}
