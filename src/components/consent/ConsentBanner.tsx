import { useConsent } from "@/contexts/ConsentContext";
import { useTranslation } from "react-i18next";
import { Shield, Settings } from "lucide-react";

export function ConsentBanner() {
  const { showBanner, acceptAll, rejectAll, openPreferences } = useConsent();
  const { t } = useTranslation();

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card/95 backdrop-blur-lg border-t border-border shadow-2xl">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {/* Icon + Text */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">
                  {t("consent.title", "Privacy & Cookie Settings")}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t(
                    "consent.message",
                    "We use cookies and similar technologies to improve your experience, analyze traffic, and display relevant ads. You can customize your preferences or accept/reject all."
                  )}
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
              <button
                onClick={openPreferences}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-medium border border-border rounded-full text-foreground hover:bg-secondary transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                {t("consent.manage", "Manage Preferences")}
              </button>
              <button
                onClick={rejectAll}
                className="px-4 py-2.5 text-xs sm:text-sm font-medium border border-border rounded-full text-foreground hover:bg-secondary transition-colors"
              >
                {t("consent.rejectAll", "Reject All")}
              </button>
              <button
                onClick={acceptAll}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all"
              >
                {t("consent.acceptAll", "Accept All")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
