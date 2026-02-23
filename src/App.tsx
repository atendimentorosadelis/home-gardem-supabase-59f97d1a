import { useEffect } from 'react';
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
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { registerServiceWorker } from "@/utils/serviceWorker";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { PageViewTracker } from "@/components/PageViewTracker";
import Index from "./pages/Index";
import Blog from "./pages/Blog";
import GardenTips from "./pages/GardenTips";
import IndoorPlants from "./pages/IndoorPlants";
import Manuals from "./pages/Manuals";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import CookiePolicy from "./pages/CookiePolicy";
import NotFound from "./pages/NotFound";
import Article from "./pages/Article";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import GenerateManualContent from "./pages/GenerateManualContent";
import ArticlesManager from "./pages/ArticlesManager";
import ArticleEditor from "./pages/ArticleEditor";
import Profile from "./pages/Profile";
import UsersManager from "./pages/UsersManager";
import Settings from "./pages/Settings";
import QueueMonitor from "./pages/QueueMonitor";
import ImagesDashboard from "./pages/ImagesDashboard";
import NewsletterManager from "./pages/NewsletterManager";
import ContactMessagesManager from "./pages/ContactMessagesManager";
import EmailTemplatesManager from "./pages/EmailTemplatesManager";
import Unsubscribe from "./pages/Unsubscribe";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import AutoPilot from "./pages/AutoPilot";
import SuperAdminPanel from "./pages/SuperAdminPanel";
import VideosManager from "./pages/VideosManager";
import VideoAutoPilot from "./pages/VideoAutoPilot";

const queryClient = new QueryClient();

// Register service worker on app load
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
            <PageViewTracker />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/garden-tips" element={<GardenTips />} />
              <Route path="/indoor-plants" element={<IndoorPlants />} />
              <Route path="/manuals" element={<Manuals />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-use" element={<TermsOfUse />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/:categorySlug/:postId" element={<Article />} />

              {/* Protected Admin Routes */}
              <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
              <Route path="/admin/articles" element={<AdminRoute><ArticlesManager /></AdminRoute>} />
              <Route path="/admin/articles/:id" element={<AdminRoute><ArticleEditor /></AdminRoute>} />
              <Route path="/admin/generate" element={<AdminRoute><GenerateManualContent /></AdminRoute>} />
              <Route path="/admin/profile" element={<AdminRoute><Profile /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><UsersManager /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
              <Route path="/admin/queue" element={<AdminRoute><QueueMonitor /></AdminRoute>} />
              <Route path="/admin/images" element={<AdminRoute><ImagesDashboard /></AdminRoute>} />
              <Route path="/admin/newsletter" element={<AdminRoute><NewsletterManager /></AdminRoute>} />
              <Route path="/admin/messages" element={<AdminRoute><ContactMessagesManager /></AdminRoute>} />
              <Route path="/admin/email-templates" element={<AdminRoute><EmailTemplatesManager /></AdminRoute>} />
              <Route path="/admin/affiliates" element={<AdminRoute><AffiliateDashboard /></AdminRoute>} />
              <Route path="/admin/autopilot" element={<AdminRoute><AutoPilot /></AdminRoute>} />
              <Route path="/admin/super-admin" element={<AdminRoute><SuperAdminPanel /></AdminRoute>} />
              <Route path="/admin/videos" element={<AdminRoute><VideosManager /></AdminRoute>} />
              <Route path="/admin/video-autopilot" element={<AdminRoute><VideoAutoPilot /></AdminRoute>} />

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
