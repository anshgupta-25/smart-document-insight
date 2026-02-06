import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AuditAlert {
  id: string;
  type: "missing" | "noise" | "info";
  title: string;
  description: string;
  suggestion?: string;
}

interface AuditAlertsProps {
  alerts: AuditAlert[];
}

export function AuditAlerts({ alerts }: AuditAlertsProps) {
  const getIcon = (type: AuditAlert["type"]) => {
    switch (type) {
      case "missing": return <AlertTriangle className="w-4 h-4" />;
      case "noise": return <AlertCircle className="w-4 h-4" />;
      case "info": return <Info className="w-4 h-4" />;
    }
  };

  const getStyle = (type: AuditAlert["type"]) => {
    switch (type) {
      case "missing": return "border-warning/30 bg-warning/5 text-warning";
      case "noise": return "border-destructive/30 bg-destructive/5 text-destructive";
      case "info": return "border-info/30 bg-info/5 text-info";
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-foreground">Audit Alerts</h3>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={cn("rounded-lg border p-3 animate-slide-up", getStyle(alert.type))}
        >
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0">{getIcon(alert.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">{alert.title}</p>
              <p className="text-[11px] opacity-80 mt-0.5">{alert.description}</p>
              {alert.suggestion && (
                <p className="text-[10px] font-mono opacity-60 mt-1.5 leading-relaxed">
                  💡 {alert.suggestion}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
