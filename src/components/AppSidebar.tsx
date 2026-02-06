import { useState } from "react";
import { FileText, Search, BarChart3, Zap, ChevronLeft, ChevronRight, Sun, Moon } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

const navItems = [
  { title: "Compression Studio", url: "/", icon: FileText },
  { title: "Retrieval Audit Lab", url: "/retrieval-audit", icon: Search },
  { title: "Intelligence Dashboard", url: "/analytics", icon: BarChart3 },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName.charAt(0).toUpperCase();

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

      {/* Bottom section */}
      <div className="border-t border-border">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center gap-3 w-full px-4 py-2.5 text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
            collapsed && "justify-center"
          )}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 shrink-0 text-warning" />
          ) : (
            <Moon className="w-4 h-4 shrink-0 text-primary" />
          )}
          {!collapsed && (
            <span className="text-xs animate-fade-in">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          )}
        </button>

        {/* User avatar */}
        {user && (
          <NavLink
            to="/profile"
            className="flex items-center gap-3 px-4 py-3 text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover border border-border shrink-0" />
            ) : (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-semibold shrink-0">
                {initials}
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-xs font-medium text-foreground truncate">{displayName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            )}
          </NavLink>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full p-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
