import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { JudgeDemoMode } from "@/components/JudgeDemoMode";
import DocumentCompression from "./pages/DocumentCompression";
import RetrievalAudit from "./pages/RetrievalAudit";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import VerifiedProfile from "./pages/VerifiedProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<DocumentCompression />} />
            <Route path="/retrieval-audit" element={<RetrievalAudit />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/profile" element={<VerifiedProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DashboardLayout>
        <JudgeDemoMode />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
