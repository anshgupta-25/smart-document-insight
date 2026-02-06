import { useState } from "react";
import { FileText, Search, BarChart3, User, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Compression Studio", url: "/", icon: FileText },
  { title: "Retrieval Audit Lab", url: "/retrieval-audit", icon: Search },
  { title: "Intelligence Dashboard", url: "/analytics", icon: BarChart3 },
  { title: "Verified Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-sidebar transition-all duration-300 shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-primary shadow-glow shrink-0">
          <Zap className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-sm font-semibold text-foreground tracking-tight">GhostCut</h1>
            <p className="text-[10px] text-muted-foreground">Intelligent Document Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground shadow-glow"
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="animate-fade-in">{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-3 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
