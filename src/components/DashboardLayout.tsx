import { AppSidebar } from "@/components/AppSidebar";
import { useSidebarState } from "@/hooks/useSidebarState";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { collapsed } = useSidebarState();

  return (
    <div className="min-h-screen w-full bg-background">
      <AppSidebar />
      <main
        className={cn(
          "min-h-screen overflow-auto scrollbar-thin transition-all duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        {children}
      </main>
    </div>
  );
}
