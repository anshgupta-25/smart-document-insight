import { create } from "zustand";
import type { SummarySection } from "@/components/SummaryPanel";
import type { ChunkData } from "@/components/ChunkViewer";
import type { AuditAlert } from "@/components/AuditAlerts";

export interface DocumentState {
  fileName: string | null;
  rawText: string | null;
  chunks: ChunkData[];
  summaries: SummarySection[];
  isProcessing: boolean;
  isAuditing: boolean;
  auditQuery: string;
  auditResults: {
    retrievedChunks: ChunkData[];
    integrityScore: number;
    coverageData: { label: string; coverage: number }[];
    alerts: AuditAlert[];
    explanation: string;
    suggestions: string[];
  } | null;
  setDocument: (fileName: string, rawText: string) => void;
  setChunks: (chunks: ChunkData[]) => void;
  setSummaries: (summaries: SummarySection[]) => void;
  setIsProcessing: (v: boolean) => void;
  setIsAuditing: (v: boolean) => void;
  setAuditQuery: (q: string) => void;
  setAuditResults: (r: DocumentState["auditResults"]) => void;
  reset: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  fileName: null,
  rawText: null,
  chunks: [],
  summaries: [],
  isProcessing: false,
  isAuditing: false,
  auditQuery: "",
  auditResults: null,
  setDocument: (fileName, rawText) => set({ fileName, rawText }),
  setChunks: (chunks) => set({ chunks }),
  setSummaries: (summaries) => set({ summaries }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setIsAuditing: (isAuditing) => set({ isAuditing }),
  setAuditQuery: (auditQuery) => set({ auditQuery }),
  setAuditResults: (auditResults) => set({ auditResults }),
  reset: () => set({
    fileName: null,
    rawText: null,
    chunks: [],
    summaries: [],
    isProcessing: false,
    isAuditing: false,
    auditQuery: "",
    auditResults: null,
  }),
}));
