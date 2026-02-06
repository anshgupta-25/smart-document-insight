import { useState } from "react";
import {
  ChevronDown, ChevronRight, FileText, Hash, Calendar,
  AlertTriangle, MapPin, ShieldCheck, ShieldAlert, ShieldX, Eye, Layers, Star, Circle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImportanceBadge, type ImportanceLevel } from "@/components/ImportanceLegend";

export interface SummarySection {
  id: string;
  title: string;
  level: "document" | "chapter" | "section";
  summary: string;
  evidence?: string;
  sourceRef?: string;
  originalText?: string;
  verified?: boolean;
  verificationStatus?: "verified" | "unverified" | "conflict";
  verificationNote?: string;
  importance?: {
    level: ImportanceLevel;
    score: number;
    reason: string;
  };
  extractedEntities?: {
    numbers: string[];
    dates: string[];
    risks: string[];
    constraints: string[];
    exceptions: string[];
  };
  children?: SummarySection[];
}

export type SummaryViewLevel = "tldr" | "detailed" | "evidence";

interface SummaryPanelProps {
  sections: SummarySection[];
  onHighlightSource?: (text: string) => void;
  viewLevel?: SummaryViewLevel;
  onViewLevelChange?: (level: SummaryViewLevel) => void;
  importanceFilter?: ImportanceLevel | null;
}

const verificationBadge = {
  verified: {
    icon: <ShieldCheck className="w-3 h-3" />,
    label: "Verified",
    className: "bg-success/15 text-success border-success/30",
  },
  unverified: {
    icon: <ShieldAlert className="w-3 h-3" />,
    label: "Unverified",
    className: "bg-warning/15 text-warning border-warning/30",
  },
  conflict: {
    icon: <ShieldX className="w-3 h-3" />,
    label: "Conflict",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

const VIEW_LEVELS: { value: SummaryViewLevel; label: string; description: string }[] = [
  { value: "tldr", label: "TL;DR", description: "Executive summary only" },
  { value: "detailed", label: "Detailed", description: "Section summaries" },
  { value: "evidence", label: "Evidence", description: "Full source evidence" },
];

const importanceBorderStyle = {
  critical: "border-l-4 border-l-warning",
  important: "border-l-4 border-l-info",
  supporting: "",
};

function shouldShow(section: SummarySection, filter: ImportanceLevel | null): boolean {
  if (!filter) return true;
  return section.importance?.level === filter;
}

/* ── Evidence Node (Level 3) ── */
function EvidenceNode({
  section,
  onHighlightSource,
}: {
  section: SummarySection;
  onHighlightSource?: (text: string) => void;
}) {
  const status = section.verificationStatus || (section.verified ? "verified" : "unverified");
  const badge = verificationBadge[status];

  return (
    <div className={cn("ml-10 border-l-2 border-border pl-4 py-2 animate-fade-in", section.importance && importanceBorderStyle[section.importance.level])}>
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1", badge.className)}>
          {badge.icon} {badge.label}
        </span>
        {section.importance && (
          <ImportanceBadge {...section.importance} />
        )}
        {section.sourceRef && (
          <span className="text-[10px] font-mono text-muted-foreground">{section.sourceRef}</span>
        )}
      </div>
      <p className="text-xs text-secondary-foreground leading-relaxed">{section.summary}</p>
      {section.evidence && (
        <div className="mt-2 rounded-lg bg-muted/50 p-2.5 text-xs font-mono text-muted-foreground leading-relaxed border border-border">
          <div className="flex items-center gap-1.5 mb-1.5 text-[10px] uppercase tracking-wider text-primary">
            <FileText className="w-3 h-3" /> Source Quote
          </div>
          {section.evidence}
        </div>
      )}
      {section.evidence && onHighlightSource && (
        <button
          onClick={() => onHighlightSource(section.evidence!)}
          className="mt-1.5 text-xs text-info hover:underline flex items-center gap-1"
        >
          <MapPin className="w-3 h-3" /> Highlight in Source
        </button>
      )}
    </div>
  );
}

/* ── Section Node (Level 2 — Chapter) ── */
function SectionSummaryNode({
  section,
  viewLevel,
  onHighlightSource,
  importanceFilter,
}: {
  section: SummarySection;
  viewLevel: SummaryViewLevel;
  onHighlightSource?: (text: string) => void;
  importanceFilter?: ImportanceLevel | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showEvidence, setShowEvidence] = useState(false);
  const status = section.verificationStatus || (section.verified ? "verified" : "unverified");
  const badge = verificationBadge[status];
  const hasEvidenceChildren = section.children && section.children.length > 0;
  const filteredChildren = section.children?.filter((c) => shouldShow(c, importanceFilter || null)) || [];

  return (
    <div className="animate-fade-in">
      <div className={cn(
        "border rounded-lg p-4 border-info/30 bg-info/5 ml-6 transition-all duration-200",
        section.importance && importanceBorderStyle[section.importance.level]
      )}>
        <div className="flex items-start gap-3">
          {hasEvidenceChildren && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-info/20 text-info">
                section
              </span>
              <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1", badge.className)}>
                {badge.icon} {badge.label}
              </span>
              {section.importance && (
                <ImportanceBadge {...section.importance} />
              )}
              <h3 className="text-sm font-medium text-foreground truncate">{section.title}</h3>
            </div>

            <p className="text-sm text-secondary-foreground leading-relaxed">{section.summary}</p>

            {section.verificationNote && (
              <p className="text-xs text-muted-foreground italic mt-2">📋 {section.verificationNote}</p>
            )}

            {section.extractedEntities && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {section.extractedEntities.numbers.length > 0 && (
                  <div className="flex items-start gap-1.5">
                    <Hash className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    <div className="text-xs text-muted-foreground">{section.extractedEntities.numbers.join(", ")}</div>
                  </div>
                )}
                {section.extractedEntities.dates.length > 0 && (
                  <div className="flex items-start gap-1.5">
                    <Calendar className="w-3 h-3 text-info mt-0.5 shrink-0" />
                    <div className="text-xs text-muted-foreground">{section.extractedEntities.dates.join(", ")}</div>
                  </div>
                )}
                {section.extractedEntities.risks.length > 0 && (
                  <div className="flex items-start gap-1.5 col-span-2">
                    <AlertTriangle className="w-3 h-3 text-warning mt-0.5 shrink-0" />
                    <div className="text-xs text-warning">{section.extractedEntities.risks.join("; ")}</div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mt-3">
              {section.evidence && (
                <button
                  onClick={() => setShowEvidence(!showEvidence)}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  {showEvidence ? "Hide" : "View"} Source Evidence
                </button>
              )}
              {section.evidence && onHighlightSource && (
                <button
                  onClick={() => onHighlightSource(section.evidence!)}
                  className="text-xs text-info hover:underline flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" /> Highlight in Source
                </button>
              )}
            </div>

            {showEvidence && section.evidence && (
              <div className="mt-2 rounded-lg bg-muted/50 p-3 text-xs font-mono text-muted-foreground leading-relaxed border border-border">
                <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-wider text-primary">
                  <FileText className="w-3 h-3" /> Source Evidence
                </div>
                {section.evidence}
              </div>
            )}
          </div>
        </div>
      </div>

      {viewLevel === "evidence" && expanded && filteredChildren.length > 0 && (
        <div className="space-y-1 mt-1">
          {filteredChildren.map((child) => (
            <EvidenceNode key={child.id} section={child} onHighlightSource={onHighlightSource} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Executive Node (Level 1 — Document) ── */
function ExecutiveNode({
  section,
  viewLevel,
  onHighlightSource,
  importanceFilter,
}: {
  section: SummarySection;
  viewLevel: SummaryViewLevel;
  onHighlightSource?: (text: string) => void;
  importanceFilter?: ImportanceLevel | null;
}) {
  const status = section.verificationStatus || (section.verified ? "verified" : "unverified");
  const badge = verificationBadge[status];
  const filteredChildren = section.children?.filter((c) => shouldShow(c, importanceFilter || null)) || [];

  return (
    <div className="animate-fade-in space-y-3">
      <div className={cn(
        "border rounded-xl p-5 border-primary/40 bg-accent/20 transition-all duration-200",
        section.importance && importanceBorderStyle[section.importance.level]
      )}>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-primary/20 text-primary">
            executive summary
          </span>
          <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1", badge.className)}>
            {badge.icon} {badge.label}
          </span>
          {section.importance && (
            <ImportanceBadge {...section.importance} />
          )}
          <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
        </div>

        <div className="space-y-1.5">
          {section.summary.split(/\n|(?:^|\s)[-•]\s/).filter(Boolean).map((point, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-primary mt-1 shrink-0">•</span>
              <p className="text-sm text-secondary-foreground leading-relaxed">{point.trim()}</p>
            </div>
          ))}
        </div>

        {section.extractedEntities && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {section.extractedEntities.numbers.length > 0 && (
              <div className="flex items-start gap-1.5">
                <Hash className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground">{section.extractedEntities.numbers.join(", ")}</div>
              </div>
            )}
            {section.extractedEntities.dates.length > 0 && (
              <div className="flex items-start gap-1.5">
                <Calendar className="w-3 h-3 text-info mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground">{section.extractedEntities.dates.join(", ")}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {viewLevel !== "tldr" && filteredChildren.length > 0 && (
        <div className="space-y-3">
          {filteredChildren.map((child) => (
            <SectionSummaryNode
              key={child.id}
              section={child}
              viewLevel={viewLevel}
              onHighlightSource={onHighlightSource}
              importanceFilter={importanceFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Panel ── */
export function SummaryPanel({ sections, onHighlightSource, viewLevel = "detailed", onViewLevelChange, importanceFilter }: SummaryPanelProps) {
  if (sections.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Upload a document to see hierarchical summaries</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Level Selector */}
      {onViewLevelChange && (
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mr-1">View:</span>
          <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-0.5">
            {VIEW_LEVELS.map((lvl) => (
              <button
                key={lvl.value}
                onClick={() => onViewLevelChange(lvl.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                  viewLevel === lvl.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
                title={lvl.description}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Warning Banner */}
      <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-warning shrink-0" />
        <p className="text-xs text-warning">
          <strong>Trust Mode Active:</strong> Summaries are generated only from verified source text.
          Click "View Source Evidence" on any point to see proof. ⭐ = Critical, 🔵 = Important, ⚪ = Supporting.
        </p>
      </div>

      {/* Render summaries */}
      {sections.filter((s) => shouldShow(s, importanceFilter || null)).map((section) => (
        <ExecutiveNode
          key={section.id}
          section={section}
          viewLevel={viewLevel}
          onHighlightSource={onHighlightSource}
          importanceFilter={importanceFilter}
        />
      ))}
    </div>
  );
}
