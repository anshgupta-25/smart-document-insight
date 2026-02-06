import { useState, useEffect, useCallback } from "react";
import { 
  Play, Pause, SkipForward, SkipBack, X, Presentation,
  FileText, Search, BarChart3, Shield, Zap, Layers, Eye, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";

interface DemoStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  highlight: string;
  value: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: "upload",
    title: "Smart Document Ingestion",
    description: "PDF extraction with binary filtering — zero raw data leaks. OCR detection and quality validation built-in.",
    icon: FileText,
    route: "/",
    highlight: "Extraction Pipeline",
    value: "Enterprise-grade parsing with fail-safe validation",
  },
  {
    id: "compression",
    title: "3-Level Hierarchical Compression",
    description: "TL;DR → Detailed → Evidence — each level with fact verification, cross-chunk reasoning, and deduplication.",
    icon: Layers,
    route: "/",
    highlight: "Compression Studio",
    value: "30-50% compression with zero hallucination",
  },
  {
    id: "alerts",
    title: "Executive Alert System",
    description: "Auto-detects deadlines, risks, financial impacts, and policy violations. Prioritized by severity.",
    icon: Bell,
    route: "/",
    highlight: "Executive Alerts",
    value: "Real-time risk intelligence from documents",
  },
  {
    id: "importance",
    title: "Smart Importance Detection",
    description: "AI classifies content as ⭐ Critical, 🔵 Important, or ⚪ Supporting — with reasons and evidence links.",
    icon: Zap,
    route: "/",
    highlight: "Importance Highlights",
    value: "Decision-ready content at a glance",
  },
  {
    id: "transparency",
    title: "Transparency & Trust Panel",
    description: "Every AI decision shows confidence score, verification status, compression ratio, and hallucination risk.",
    icon: Eye,
    route: "/",
    highlight: "Transparency Panel",
    value: "Full explainability for every output",
  },
  {
    id: "audit",
    title: "RAG Retrieval Auditor",
    description: "Query documents and audit retrieval quality with integrity scores, coverage heatmaps, and noise detection.",
    icon: Search,
    route: "/retrieval-audit",
    highlight: "Retrieval Audit",
    value: "Enterprise RAG quality assurance",
  },
  {
    id: "analytics",
    title: "Intelligence Dashboard",
    description: "Centralized analytics for document quality, audit trends, compression performance, and retrieval metrics.",
    icon: BarChart3,
    route: "/analytics",
    highlight: "Analytics Dashboard",
    value: "Data-driven document intelligence",
  },
  {
    id: "export",
    title: "One-Click Report Export",
    description: "Generate formatted audit reports, summary documents, and intelligence briefs. Export as Markdown or JSON.",
    icon: Shield,
    route: "/",
    highlight: "Smart Export",
    value: "Enterprise reporting in seconds",
  },
];

export function JudgeDemoMode() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const step = DEMO_STEPS[currentStep];

  useEffect(() => {
    if (!isAutoPlay || !isActive) return;
    const timer = setTimeout(() => {
      if (currentStep < DEMO_STEPS.length - 1) {
        goToStep(currentStep + 1);
      } else {
        setIsAutoPlay(false);
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, [currentStep, isAutoPlay, isActive]);

  const goToStep = useCallback((index: number) => {
    setCurrentStep(index);
    const target = DEMO_STEPS[index];
    if (target.route !== location.pathname) {
      navigate(target.route);
    }
  }, [location.pathname, navigate]);

  if (!isActive) {
    return (
      <button
        onClick={() => setIsActive(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-glow hover:shadow-elevated transition-all duration-300 animate-pulse-glow"
      >
        <Presentation className="w-4 h-4" />
        Judge Mode
      </button>
    );
  }

  const Icon = step.icon;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px]" />

      {/* Demo panel */}
      <div className="relative pointer-events-auto mx-auto max-w-4xl mb-6 px-4">
        <div className="rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-xl shadow-elevated overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${((currentStep + 1) / DEMO_STEPS.length) * 100}%` }}
            />
          </div>

          <div className="p-5">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/15 text-primary shrink-0">
                <Icon className="w-6 h-6" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {currentStep + 1}/{DEMO_STEPS.length}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    {step.highlight}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-secondary-foreground mt-1 leading-relaxed">{step.description}</p>
                <p className="text-xs text-primary font-medium mt-2 flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  {step.value}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => goToStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsAutoPlay(!isAutoPlay)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    isAutoPlay
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => goToStep(Math.min(DEMO_STEPS.length - 1, currentStep + 1))}
                  disabled={currentStep === DEMO_STEPS.length - 1}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setIsActive(false); setIsAutoPlay(false); setCurrentStep(0); }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Step dots */}
            <div className="flex items-center gap-1.5 mt-4 justify-center">
              {DEMO_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToStep(i)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    i === currentStep
                      ? "bg-primary w-6"
                      : i < currentStep
                      ? "bg-primary/40"
                      : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
