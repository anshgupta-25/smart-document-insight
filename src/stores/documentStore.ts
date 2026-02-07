import { create } from "zustand";
import type { SummarySection } from "@/components/SummaryPanel";
import type { ChunkData } from "@/components/ChunkViewer";
import type { AuditAlert } from "@/components/AuditAlerts";
import type { VerificationStats } from "@/components/TransparencyPanel";
import type { ExecutiveAlert } from "@/components/ExecutiveAlerts";
import type { AIDecision } from "@/components/ExplainabilityPanel";
import type { ExtractedAnswer } from "@/components/AnswerExtractionPanel";
import type { CoverageItem } from "@/components/CoverageHeatmap";

export interface DocumentState {
  fileName: string | null;
  rawText: string | null;
  chunks: ChunkData[];
  summaries: SummarySection[];
  verificationStats: VerificationStats | null;
  executiveAlerts: ExecutiveAlert[];
  aiDecisions: AIDecision[];
  isProcessing: boolean;
  isAuditing: boolean;
  auditQuery: string;
  auditResults: {
    retrievedChunks: ChunkData[];
    integrityScore: number;
    coverageData: CoverageItem[];
    alerts: AuditAlert[];
    explanation: string;
    suggestions: string[];
    extractedAnswer?: ExtractedAnswer;
  } | null;
  highlightText: string | null;
  setDocument: (fileName: string, rawText: string) => void;
  setChunks: (chunks: ChunkData[]) => void;
  setSummaries: (summaries: SummarySection[]) => void;
  setVerificationStats: (stats: VerificationStats | null) => void;
  setExecutiveAlerts: (alerts: ExecutiveAlert[]) => void;
  setAIDecisions: (decisions: AIDecision[]) => void;
  setIsProcessing: (v: boolean) => void;
  setIsAuditing: (v: boolean) => void;
  setAuditQuery: (q: string) => void;
  setAuditResults: (r: DocumentState["auditResults"]) => void;
  setHighlightText: (text: string | null) => void;
  reset: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  fileName: null,
  rawText: null,
  chunks: [],
  summaries: [],
  verificationStats: null,
  executiveAlerts: [],
  aiDecisions: [],
  isProcessing: false,
  isAuditing: false,
  auditQuery: "",
  auditResults: null,
  highlightText: null,
  setDocument: (fileName, rawText) => set({ fileName, rawText }),
  setChunks: (chunks) => set({ chunks }),
  setSummaries: (summaries) => set({ summaries }),
  setVerificationStats: (verificationStats) => set({ verificationStats }),
  setExecutiveAlerts: (executiveAlerts) => set({ executiveAlerts }),
  setAIDecisions: (aiDecisions) => set({ aiDecisions }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setIsAuditing: (isAuditing) => set({ isAuditing }),
  setAuditQuery: (auditQuery) => set({ auditQuery }),
  setAuditResults: (auditResults) => set({ auditResults }),
  setHighlightText: (highlightText) => set({ highlightText }),
  reset: () => set({
    fileName: null,
    rawText: null,
    chunks: [],
    summaries: [],
    verificationStats: null,
    executiveAlerts: [],
    aiDecisions: [],
    isProcessing: false,
    isAuditing: false,
    auditQuery: "",
    auditResults: null,
    highlightText: null,
  }),
}));
