import { ConsentBanner } from "./ConsentBanner";
import { ConsentPreferencesModal } from "./ConsentPreferencesModal";
import { useConsent } from "@/contexts/ConsentContext";
import { useLocation } from "react-router-dom";
import { Cookie } from "lucide-react";

const ADMIN_PREFIXES = ['/dashboard', '/admin', '/articles-manager', '/generate', '/autopilot', '/settings', '/users-manager', '/newsletter', '/email-templates', '/contact-messages', '/images-dashboard', '/queue-monitor', '/affiliate', '/super-admin', '/videos-manager', '/video-autopilot', '/profile'];

export function ConsentManager() {
  const { hasConsented, showBanner, openPreferences } = useConsent();
  const { pathname } = useLocation();

  const isAdminArea = ADMIN_PREFIXES.some(p => pathname.startsWith(p));

  return (
    <>
      <ConsentBanner />
      <ConsentPreferencesModal />

      {/* Floating cookie button - only on public pages */}
      {hasConsented && !showBanner && !isAdminArea && (
        <button
          onClick={openPreferences}
          className="fixed bottom-6 left-6 z-[90] w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-secondary transition-colors"
          aria-label="Cookie settings"
        >
          <Cookie className="w-5 h-5 text-muted-foreground" />
        </button>
      )}
    </>
  );
}
