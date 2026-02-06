import { useState } from "react";
import {
  ChevronDown, ChevronRight, FileText, Hash, Calendar,
  AlertTriangle, MapPin, ShieldCheck, ShieldAlert, ShieldX, Eye, Layers,
  Star, CircleDot, Circle, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ImportanceLevel = "critical" | "important" | "supporting";

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
  importance?: ImportanceLevel;
  importanceScore?: number;
  importanceReason?: string;
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

const importanceMeta: Record<ImportanceLevel, { icon: React.ReactNode; label: string; className: string; textClass: string; borderClass: string }> = {
  critical: {
    icon: <Star className="w-3 h-3" />,
    label: "Critical",
    className: "bg-destructive/15 text-destructive border-destructive/30",
    textClass: "font-semibold text-foreground",
    borderClass: "border-l-4 border-l-destructive",
  },
  important: {
    icon: <CircleDot className="w-3 h-3" />,
    label: "Important",
    className: "bg-primary/15 text-primary border-primary/30",
    textClass: "font-medium text-foreground",
    borderClass: "border-l-4 border-l-primary",
  },
  supporting: {
    icon: <Circle className="w-3 h-3" />,
    label: "Supporting",
    className: "bg-muted text-muted-foreground border-border",
    textClass: "text-secondary-foreground",
    borderClass: "border-l-4 border-l-muted",
  },
};

const VIEW_LEVELS: { value: SummaryViewLevel; label: string; description: string }[] = [
  { value: "tldr", label: "TL;DR", description: "Executive summary only" },
  { value: "detailed", label: "Detailed", description: "Section summaries" },
  { value: "evidence", label: "Evidence", description: "Full source evidence" },
];

/* ── Importance Badge with Hover Tooltip ── */
function ImportanceBadge({ importance, score, reason }: { importance?: ImportanceLevel; score?: number; reason?: string }) {
  const level = importance || "supporting";
  const meta = importanceMeta[level];

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 cursor-help", meta.className)}>
            {meta.icon} {meta.label}
            {score !== undefined && <span className="opacity-70">({score})</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {meta.icon}
              <span className="text-xs font-medium">{meta.label} — Score: {score ?? "N/A"}/100</span>
            </div>
            {reason && <p className="text-xs text-muted-foreground">{reason}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ── Importance Legend ── */
function ImportanceLegend() {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 px-4 py-2">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Legend:</span>
      {(["critical", "important", "supporting"] as const).map((level) => {
        const meta = importanceMeta[level];
        return (
          <span key={level} className="flex items-center gap-1.5 text-xs">
            <span className={cn("px-1.5 py-0.5 rounded border flex items-center gap-1", meta.className)}>
              {meta.icon} {meta.label}
            </span>
          </span>
        );
      })}
    </div>
  );
}

/* ── Importance Filter ── */
function ImportanceFilter({
  filter,
  onFilterChange,
  showHighlights,
  onToggleHighlights,
}: {
  filter: ImportanceLevel | "all";
  onFilterChange: (f: ImportanceLevel | "all") => void;
  showHighlights: boolean;
  onToggleHighlights: () => void;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Filter:</span>
        <div className="flex gap-0.5 rounded-lg border border-border bg-muted/50 p-0.5">
          {([
            { value: "all", label: "All" },
            { value: "critical", label: "⭐ Critical" },
            { value: "important", label: "🔵 Important" },
            { value: "supporting", label: "⚪ Supporting" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFilterChange(opt.value)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-200",
                filter === opt.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onToggleHighlights}
        className={cn(
          "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-colors",
          showHighlights
            ? "bg-primary/10 border-primary/30 text-primary"
            : "bg-muted border-border text-muted-foreground hover:text-foreground"
        )}
      >
        <Eye className="w-3 h-3" />
        Highlights {showHighlights ? "ON" : "OFF"}
      </button>
    </div>
  );
}

/* ── Check if section matches filter ── */
function matchesFilter(section: SummarySection, filter: ImportanceLevel | "all"): boolean {
  if (filter === "all") return true;
  return (section.importance || "supporting") === filter;
}

function hasMatchingChildren(section: SummarySection, filter: ImportanceLevel | "all"): boolean {
  if (matchesFilter(section, filter)) return true;
  return section.children?.some(c => hasMatchingChildren(c, filter)) ?? false;
}

/* ── Evidence Node (Level 3) ── */
function EvidenceNode({
  section,
  onHighlightSource,
  showHighlights,
}: {
  section: SummarySection;
  onHighlightSource?: (text: string) => void;
  showHighlights: boolean;
}) {
  const status = section.verificationStatus || (section.verified ? "verified" : "unverified");
  const badge = verificationBadge[status];
  const importance = section.importance || "supporting";
  const impMeta = importanceMeta[importance];

  return (
    <div className={cn(
      "ml-10 pl-4 py-2 animate-fade-in",
      showHighlights ? impMeta.borderClass : "border-l-2 border-border",
    )}>
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <ImportanceBadge importance={section.importance} score={section.importanceScore} reason={section.importanceReason} />
        <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1", badge.className)}>
          {badge.icon} {badge.label}
        </span>
        {section.sourceRef && (
          <span className="text-[10px] font-mono text-muted-foreground">{section.sourceRef}</span>
        )}
      </div>
      <p className={cn("text-xs leading-relaxed", showHighlights ? impMeta.textClass : "text-secondary-foreground")}>
        {section.summary}
      </p>
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
  showHighlights,
  filter,
}: {
  section: SummarySection;
  viewLevel: SummaryViewLevel;
  onHighlightSource?: (text: string) => void;
  showHighlights: boolean;
  filter: ImportanceLevel | "all";
}) {
  const [expanded, setExpanded] = useState(true);
  const [showEvidence, setShowEvidence] = useState(false);
  const status = section.verificationStatus || (section.verified ? "verified" : "unverified");
  const badge = verificationBadge[status];
  const hasEvidenceChildren = section.children && section.children.length > 0;
  const importance = section.importance || "supporting";
  const impMeta = importanceMeta[importance];

  const filteredChildren = section.children?.filter(c => hasMatchingChildren(c, filter)) ?? [];

  return (
    <div className="animate-fade-in">
      <div className={cn(
        "border rounded-lg p-4 ml-6 transition-all duration-200",
        showHighlights && importance === "critical"
          ? "border-destructive/40 bg-destructive/5"
          : showHighlights && importance === "important"
          ? "border-primary/40 bg-primary/5"
          : "border-info/30 bg-info/5"
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
              <ImportanceBadge importance={section.importance} score={section.importanceScore} reason={section.importanceReason} />
              <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1", badge.className)}>
                {badge.icon} {badge.label}
              </span>
              <h3 className={cn("text-sm font-medium truncate", showHighlights ? impMeta.textClass : "text-foreground")}>
                {section.title}
              </h3>
            </div>

            <p className={cn("text-sm leading-relaxed", showHighlights ? impMeta.textClass : "text-secondary-foreground")}>
              {section.summary}
            </p>

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
            <EvidenceNode key={child.id} section={child} onHighlightSource={onHighlightSource} showHighlights={showHighlights} />
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
  showHighlights,
  filter,
}: {
  section: SummarySection;
  viewLevel: SummaryViewLevel;
  onHighlightSource?: (text: string) => void;
  showHighlights: boolean;
  filter: ImportanceLevel | "all";
}) {
  const status = section.verificationStatus || (section.verified ? "verified" : "unverified");
  const badge = verificationBadge[status];

  const filteredChildren = section.children?.filter(c => hasMatchingChildren(c, filter)) ?? [];

  return (
    <div className="animate-fade-in space-y-3">
      <div className="border rounded-xl p-5 border-primary/40 bg-accent/20 transition-all duration-200">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-primary/20 text-primary">
            executive summary
          </span>
          <ImportanceBadge importance={section.importance} score={section.importanceScore} reason={section.importanceReason} />
          <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1", badge.className)}>
            {badge.icon} {badge.label}
          </span>
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
              showHighlights={showHighlights}
              filter={filter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Panel ── */
export function SummaryPanel({ sections, onHighlightSource, viewLevel = "detailed", onViewLevelChange }: SummaryPanelProps) {
  const [filter, setFilter] = useState<ImportanceLevel | "all">("all");
  const [showHighlights, setShowHighlights] = useState(true);

  if (sections.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Upload a document to see hierarchical summaries</p>
      </div>
    );
  }

  const filteredSections = sections.filter(s => hasMatchingChildren(s, filter));

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

      {/* Importance Legend + Filter */}
      <ImportanceLegend />
      <ImportanceFilter
        filter={filter}
        onFilterChange={setFilter}
        showHighlights={showHighlights}
        onToggleHighlights={() => setShowHighlights(!showHighlights)}
      />

      {/* Warning Banner */}
      <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-warning shrink-0" />
        <p className="text-xs text-warning">
          <strong>Trust Mode Active:</strong> Summaries are generated only from verified source text.
          Click "View Source Evidence" on any point to see proof.
        </p>
      </div>

      {/* Render summaries */}
      {filteredSections.map((section) => (
        <ExecutiveNode
          key={section.id}
          section={section}
          viewLevel={viewLevel}
          onHighlightSource={onHighlightSource}
          showHighlights={showHighlights}
          filter={filter}
        />
      ))}

      {filter !== "all" && filteredSections.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Filter className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No items match the "{filter}" filter</p>
        </div>
      )}
    </div>
  );
}
