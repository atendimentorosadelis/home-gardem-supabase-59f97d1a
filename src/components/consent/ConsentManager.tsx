import { ConsentBanner } from "./ConsentBanner";
import { ConsentPreferencesModal } from "./ConsentPreferencesModal";
import { useConsent } from "@/contexts/ConsentContext";
import { Cookie } from "lucide-react";

export function ConsentManager() {
  const { hasConsented, showBanner, openPreferences } = useConsent();

  return (
    <>
      <ConsentBanner />
      <ConsentPreferencesModal />

      {/* Floating cookie button - shows only after user has consented and banner is hidden */}
      {hasConsented && !showBanner && (
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
