import { cn } from "@/lib/utils";

interface ScoreMeterProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
}

export function ScoreMeter({ score, label, size = "md" }: ScoreMeterProps) {
  const radius = size === "lg" ? 56 : size === "md" ? 44 : 32;
  const stroke = size === "lg" ? 6 : size === "md" ? 5 : 4;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const svgSize = (radius + stroke) * 2;

  const getColor = () => {
    if (score >= 80) return "hsl(var(--success))";
    if (score >= 50) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={stroke}
          />
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - filled}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "font-semibold font-mono",
            size === "lg" ? "text-2xl" : size === "md" ? "text-lg" : "text-sm"
          )} style={{ color: getColor() }}>
            {score}
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
