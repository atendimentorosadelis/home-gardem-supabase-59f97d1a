import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { CookieConsent } from "@/components/CookieConsent";
import { AuthProvider } from "@/contexts/AuthContext";
import { ImageApprovalProvider } from "@/contexts/ImageApprovalContext";
import { NavigationBlockProvider } from "@/contexts/NavigationBlockContext";
import { OnlinePresenceProvider } from "@/contexts/OnlinePresenceContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import { registerServiceWorker } from "@/utils/serviceWorker";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

if (typeof window !== 'undefined') {
  registerServiceWorker();
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" storageKey="theme">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OnlinePresenceProvider>
        <ImageApprovalProvider>
        <NavigationBlockProvider>
        <TooltipProvider>
          <GoogleAnalytics />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieConsent />
          </BrowserRouter>
        </TooltipProvider>
        </NavigationBlockProvider>
        </ImageApprovalProvider>
        </OnlinePresenceProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
