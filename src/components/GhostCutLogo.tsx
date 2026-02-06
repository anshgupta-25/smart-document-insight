interface GhostCutLogoProps {
  size?: number;
  className?: string;
  ghostMode?: boolean;
}

export function GhostCutLogo({ size = 40, className = "", ghostMode = false }: GhostCutLogoProps) {
  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* Rounded background */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="22"
          fill="url(#bg-gradient)"
          stroke="url(#border-gradient)"
          strokeWidth="2"
        />

        {/* Ghost body */}
        <path
          d="M50 22C36.2 22 25 33.2 25 47v24c0 1.5 1.8 2.3 2.9 1.2l5.1-5.1c1-1 2.6-1 3.5 0l4.5 4.5c1 1 2.6 1 3.5 0l5-5c1-1 2.6-1 3.5 0l5 5c1 1 2.6 1 3.5 0l4.5-4.5c1-1 2.6-1 3.5 0l5.1 5.1c1.1 1.1 2.9.3 2.9-1.2V47C75 33.2 63.8 22 50 22Z"
          fill="url(#ghost-gradient)"
          opacity="0.95"
        />

        {/* Left eye */}
        <ellipse cx="40" cy="48" rx="5" ry="5.5" fill="hsl(220, 20%, 12%)" opacity="0.85" />
        <ellipse cx="41.5" cy="46.5" rx="1.8" ry="2" fill="white" opacity="0.9" />

        {/* Right eye */}
        <ellipse cx="60" cy="48" rx="5" ry="5.5" fill="hsl(220, 20%, 12%)" opacity="0.85" />
        <ellipse cx="61.5" cy="46.5" rx="1.8" ry="2" fill="white" opacity="0.9" />

        {/* Subtle mouth */}
        <path
          d="M44 58c2 2 10 2 12 0"
          stroke="hsl(220, 20%, 12%)"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.5"
          fill="none"
        />

        {/* Teal/Green accent dot (top-right) — AI trust indicator */}
        <circle cx="72" cy="20" r="6" fill="hsl(152, 60%, 45%)" />
        <circle cx="72" cy="20" r="3" fill="hsl(152, 60%, 62%)" opacity="0.6" />

        {/* Ghost mode glow ring */}
        {ghostMode && (
          <rect
            x="2"
            y="2"
            width="96"
            height="96"
            rx="24"
            fill="none"
            stroke="hsl(152, 60%, 45%)"
            strokeWidth="2"
            opacity="0.5"
            className="animate-pulse"
          />
        )}

        {/* Gradient definitions */}
        <defs>
          <linearGradient id="bg-gradient" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="hsl(174, 30%, 92%)" />
            <stop offset="100%" stopColor="hsl(174, 40%, 85%)" />
          </linearGradient>
          <linearGradient id="border-gradient" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="hsl(174, 50%, 78%)" />
            <stop offset="100%" stopColor="hsl(174, 30%, 88%)" />
          </linearGradient>
          <linearGradient id="ghost-gradient" x1="30" y1="22" x2="70" y2="75">
            <stop offset="0%" stopColor="hsl(0, 0%, 100%)" />
            <stop offset="50%" stopColor="hsl(174, 20%, 96%)" />
            <stop offset="100%" stopColor="hsl(174, 30%, 90%)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

interface GhostCutBrandProps {
  size?: number;
  showTagline?: boolean;
  className?: string;
}

export function GhostCutBrand({ size = 36, showTagline = false, className = "" }: GhostCutBrandProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <GhostCutLogo size={size} />
      <div className="min-w-0">
        <h1 className="text-sm font-bold text-foreground tracking-tight leading-tight">
          GHOST<span className="text-primary">CUT</span>
        </h1>
        {showTagline && (
          <p className="text-[10px] text-muted-foreground font-mono tracking-wider leading-tight truncate">
            Cutting Hallucinations Out of AI
          </p>
        )}
      </div>
    </div>
  );
}
