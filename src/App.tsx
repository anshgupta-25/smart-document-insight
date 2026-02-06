import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { SidebarStateProvider } from "@/hooks/useSidebarState";
import { JudgeSearchProvider } from "@/hooks/useJudgeSearch";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import { JudgeDemoMode } from "@/components/JudgeDemoMode";
import DocumentCompression from "./pages/DocumentCompression";
import RetrievalAudit from "./pages/RetrievalAudit";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import VerifiedProfile from "./pages/VerifiedProfile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SidebarStateProvider>
          <JudgeSearchProvider>
            <Routes>
              {/* Public auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <DocumentCompression />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/retrieval-audit"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <RetrievalAudit />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AnalyticsDashboard />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <VerifiedProfile />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <JudgeDemoMode />
          </JudgeSearchProvider>
          </SidebarStateProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
