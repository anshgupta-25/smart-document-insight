import { useState } from "react";
import {
  ChevronDown, ChevronRight, FileText, Hash, Calendar,
  AlertTriangle, MapPin, ShieldCheck, ShieldAlert, ShieldX, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  extractedEntities?: {
    numbers: string[];
    dates: string[];
    risks: string[];
    constraints: string[];
    exceptions: string[];
  };
  children?: SummarySection[];
}

interface SummaryPanelProps {
  sections: SummarySection[];
  onHighlightSource?: (text: string) => void;
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

function SectionNode({
  section,
  depth = 0,
  onHighlightSource,
}: {
  section: SummarySection;
  depth?: number;
  onHighlightSource?: (text: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const [showEvidence, setShowEvidence] = useState(false);

  const levelColors = {
    document: "border-primary/40 bg-accent/20",
    chapter: "border-info/30 bg-info/5",
    section: "border-border",
  };

  const levelBadge = {
    document: "bg-primary/20 text-primary",
    chapter: "bg-info/20 text-info",
    section: "bg-muted text-muted-foreground",
  };

  const status = section.verificationStatus || (section.verified ? "verified" : "unverified");
  const badge = verificationBadge[status];

  return (
    <div className="animate-fade-in">
      <div
        className={cn(
          "border rounded-lg p-4 transition-all duration-200",
          levelColors[section.level],
          depth > 0 && "ml-6"
        )}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={cn(
                  "text-[10px] font-mono uppercase px-2 py-0.5 rounded",
                  levelBadge[section.level]
                )}
              >
                {section.level}
              </span>

              {/* Verification Badge */}
              <span
                className={cn(
                  "text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1",
                  badge.className
                )}
              >
                {badge.icon} {badge.label}
              </span>

              <h3 className="text-sm font-medium text-foreground truncate">{section.title}</h3>
            </div>

            {expanded && (
              <div className="space-y-3 animate-fade-in">
                <p className="text-sm text-secondary-foreground leading-relaxed">{section.summary}</p>

                {section.verificationNote && (
                  <p className="text-xs text-muted-foreground italic">
                    📋 {section.verificationNote}
                  </p>
                )}

                {section.sourceRef && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="font-mono">{section.sourceRef}</span>
                  </div>
                )}

                {section.extractedEntities && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {section.extractedEntities.numbers.length > 0 && (
                      <div className="flex items-start gap-1.5">
                        <Hash className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                        <div className="text-xs text-muted-foreground">
                          {section.extractedEntities.numbers.join(", ")}
                        </div>
                      </div>
                    )}
                    {section.extractedEntities.dates.length > 0 && (
                      <div className="flex items-start gap-1.5">
                        <Calendar className="w-3 h-3 text-info mt-0.5 shrink-0" />
                        <div className="text-xs text-muted-foreground">
                          {section.extractedEntities.dates.join(", ")}
                        </div>
                      </div>
                    )}
                    {section.extractedEntities.risks.length > 0 && (
                      <div className="flex items-start gap-1.5 col-span-2">
                        <AlertTriangle className="w-3 h-3 text-warning mt-0.5 shrink-0" />
                        <div className="text-xs text-warning">
                          {section.extractedEntities.risks.join("; ")}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* View Source / Evidence Button */}
                <div className="flex items-center gap-3">
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
                      <MapPin className="w-3 h-3" />
                      Highlight in Source
                    </button>
                  )}
                </div>

                {showEvidence && section.evidence && (
                  <div className="rounded-lg bg-muted/50 p-3 text-xs font-mono text-muted-foreground leading-relaxed border border-border">
                    <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-wider text-primary">
                      <FileText className="w-3 h-3" /> Source Evidence
                    </div>
                    {section.evidence}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded &&
        section.children?.map((child) => (
          <SectionNode
            key={child.id}
            section={child}
            depth={depth + 1}
            onHighlightSource={onHighlightSource}
          />
        ))}
    </div>
  );
}

export function SummaryPanel({ sections, onHighlightSource }: SummaryPanelProps) {
  if (sections.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Upload a document to see hierarchical summaries</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Warning Banner */}
      <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-warning shrink-0" />
        <p className="text-xs text-warning">
          <strong>Trust Mode Active:</strong> Summaries are generated only from verified source text. 
          Click "View Source Evidence" on any point to see proof.
        </p>
      </div>

      {sections.map((section) => (
        <SectionNode key={section.id} section={section} onHighlightSource={onHighlightSource} />
      ))}
    </div>
  );
}
