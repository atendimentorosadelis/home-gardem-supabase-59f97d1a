import { useConsent } from "@/contexts/ConsentContext";
import { useTranslation } from "react-i18next";
import { Shield, Settings, Cookie } from "lucide-react";

export function ConsentBanner() {
  const { showBanner, acceptAll, rejectAll, openPreferences } = useConsent();
  const { t } = useTranslation();

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie icon floating */}
      <div className="fixed bottom-6 left-6 z-[99] w-12 h-12 rounded-full bg-muted border border-border shadow-lg flex items-center justify-center">
        <Cookie className="w-6 h-6 text-muted-foreground" />
      </div>

      {/* Card popup */}
      <div className="fixed bottom-20 left-6 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-500">
        <div className="bg-card border border-border rounded-3xl p-6 shadow-2xl w-[380px] max-w-[calc(100vw-3rem)]">
          {/* Icon + Title */}
          <div className="flex items-start gap-3 mb-3">
            <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
              <Shield className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">
                {t("consent.title", "Privacy & Cookie Settings")}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(
                  "consent.message",
                  "We use cookies and similar technologies to improve your experience, analyze traffic, and display relevant ads. You can customize your preferences or accept/reject all."
                )}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={openPreferences}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-border rounded-full text-foreground hover:bg-secondary transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              {t("consent.manage", "Manage Preferences")}
            </button>
            <button
              onClick={rejectAll}
              className="px-4 py-2 text-xs font-medium border border-border rounded-full text-foreground hover:bg-secondary transition-colors"
            >
              {t("consent.rejectAll", "Reject All")}
            </button>
            <button
              onClick={acceptAll}
              className="px-5 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all"
            >
              {t("consent.acceptAll", "Accept All")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
