import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Overview from "./pages/Overview";
import News from "./pages/News";
import Podcasts from "./pages/Podcasts";
import DashboardPodcasts from "./pages/DashboardPodcasts";
import Reports from "./pages/Reports";
import Accounts from "./pages/Accounts";
import Clients from "./pages/Clients";
import Sources from "./pages/Sources";
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
            <Route path="/" element={<Dashboard />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/news" element={<News />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/dashboard/podcasts" element={<DashboardPodcasts />} />
            <Route path="/podcasts" element={<Podcasts />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/sources" element={<Sources />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
