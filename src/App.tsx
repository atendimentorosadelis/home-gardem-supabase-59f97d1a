import { lazy, Suspense } from 'react';
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

// Critical pages - loaded eagerly
import Index from "./pages/Index";

// Public pages - lazy loaded
const Blog = lazy(() => import("./pages/Blog"));
const Article = lazy(() => import("./pages/Article"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const GardenTips = lazy(() => import("./pages/GardenTips"));
const IndoorPlants = lazy(() => import("./pages/IndoorPlants"));
const Manuals = lazy(() => import("./pages/Manuals"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));

// Admin pages - lazy loaded
const Dashboard = lazy(() => import("./pages/Dashboard"));
const GenerateManualContent = lazy(() => import("./pages/GenerateManualContent"));
const ArticlesManager = lazy(() => import("./pages/ArticlesManager"));
const ArticleEditor = lazy(() => import("./pages/ArticleEditor"));
const Profile = lazy(() => import("./pages/Profile"));
const UsersManager = lazy(() => import("./pages/UsersManager"));
const Settings = lazy(() => import("./pages/Settings"));
const QueueMonitor = lazy(() => import("./pages/QueueMonitor"));
const ImagesDashboard = lazy(() => import("./pages/ImagesDashboard"));
const NewsletterManager = lazy(() => import("./pages/NewsletterManager"));
const ContactMessagesManager = lazy(() => import("./pages/ContactMessagesManager"));
const EmailTemplatesManager = lazy(() => import("./pages/EmailTemplatesManager"));
const AffiliateDashboard = lazy(() => import("./pages/AffiliateDashboard"));
const AutoPilot = lazy(() => import("./pages/AutoPilot"));
const SuperAdminPanel = lazy(() => import("./pages/SuperAdminPanel"));
const VideosManager = lazy(() => import("./pages/VideosManager"));
const VideoAutoPilot = lazy(() => import("./pages/VideoAutoPilot"));

const queryClient = new QueryClient();

if (typeof window !== 'undefined') {
  registerServiceWorker();
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" storageKey="theme">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OnlinePresenceProvider>
        <ImageApprovalProvider>
        <NavigationBlockProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <GoogleAnalytics />
            <ScrollToTop />
            <PageViewTracker />
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
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
