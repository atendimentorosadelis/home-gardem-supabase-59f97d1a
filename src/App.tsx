import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ConsentProvider } from "@/contexts/ConsentContext";
import { ConsentManager } from "@/components/consent/ConsentManager";
import { AdConsentController } from "@/components/consent/AdConsentController";
import { AuthProvider } from "@/contexts/AuthContext";
import { ImageApprovalProvider } from "@/contexts/ImageApprovalContext";
import { NavigationBlockProvider } from "@/contexts/NavigationBlockContext";
import { OnlinePresenceProvider } from "@/contexts/OnlinePresenceContext";
import { ArticleGenerationProvider } from "@/contexts/ArticleGenerationContext";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import { registerServiceWorker } from "@/utils/serviceWorker";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { FacebookPixel } from "@/components/FacebookPixel";
import { PageViewTracker } from "@/components/PageViewTracker";

// Helper to retry dynamic imports on chunk load failure (stale cache after deploy)
function lazyRetry(factory: () => Promise<any>) {
  return lazy(() =>
    factory().catch(() => {
      const key = 'lazyRetry_reload';
      const lastReload = sessionStorage.getItem(key);
      const now = Date.now().toString();
      // Only reload if we haven't reloaded in the last 10 seconds (prevent loop)
      if (!lastReload || Date.now() - parseInt(lastReload) > 10000) {
        sessionStorage.setItem(key, now);
        window.location.reload();
        return new Promise(() => {}); // Never resolves, page will reload
      }
      // If already reloaded recently, show error
      sessionStorage.removeItem(key);
      return Promise.reject(new Error('Failed to load page after refresh. Please clear your browser cache.'));
    })
  );
}

// Critical pages - loaded eagerly
import Index from "./pages/Index";

// Public pages - lazy loaded
const Blog = lazyRetry(() => import("./pages/Blog"));
const Article = lazyRetry(() => import("./pages/Article"));
const About = lazyRetry(() => import("./pages/About"));
const Contact = lazyRetry(() => import("./pages/Contact"));
const GardenTips = lazyRetry(() => import("./pages/GardenTips"));
const IndoorPlants = lazyRetry(() => import("./pages/IndoorPlants"));
const Manuals = lazyRetry(() => import("./pages/Manuals"));
const PrivacyPolicy = lazyRetry(() => import("./pages/PrivacyPolicy"));
const TermsOfUse = lazyRetry(() => import("./pages/TermsOfUse"));
const CookiePolicy = lazyRetry(() => import("./pages/CookiePolicy"));
const Unsubscribe = lazyRetry(() => import("./pages/Unsubscribe"));
const NotFound = lazyRetry(() => import("./pages/NotFound"));
const AdminLogin = lazyRetry(() => import("./pages/AdminLogin"));

// Admin pages - lazy loaded
const Dashboard = lazyRetry(() => import("./pages/Dashboard"));
const GenerateManualContent = lazyRetry(() => import("./pages/GenerateManualContent"));
const ArticlesManager = lazyRetry(() => import("./pages/ArticlesManager"));
const ArticleEditor = lazyRetry(() => import("./pages/ArticleEditor"));
const Profile = lazyRetry(() => import("./pages/Profile"));
const UsersManager = lazyRetry(() => import("./pages/UsersManager"));
const Settings = lazyRetry(() => import("./pages/Settings"));
const QueueMonitor = lazyRetry(() => import("./pages/QueueMonitor"));
const ImagesDashboard = lazyRetry(() => import("./pages/ImagesDashboard"));
const NewsletterManager = lazyRetry(() => import("./pages/NewsletterManager"));
const ContactMessagesManager = lazyRetry(() => import("./pages/ContactMessagesManager"));
const EmailTemplatesManager = lazyRetry(() => import("./pages/EmailTemplatesManager"));
const AffiliateDashboard = lazyRetry(() => import("./pages/AffiliateDashboard"));
const AutoPilot = lazyRetry(() => import("./pages/AutoPilot"));
const SuperAdminPanel = lazyRetry(() => import("./pages/SuperAdminPanel"));
const VideosManager = lazyRetry(() => import("./pages/VideosManager"));
const VideoAutoPilot = lazyRetry(() => import("./pages/VideoAutoPilot"));

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
        <ConsentProvider>
        <OnlinePresenceProvider>
        <ImageApprovalProvider>
        <NavigationBlockProvider>
        <ArticleGenerationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <GoogleAnalytics />
            <FacebookPixel />
            <AdConsentController />
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
            <ConsentManager />
          </BrowserRouter>
        </TooltipProvider>
        </ArticleGenerationProvider>
        </NavigationBlockProvider>
        </ImageApprovalProvider>
        </OnlinePresenceProvider>
        </ConsentProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
