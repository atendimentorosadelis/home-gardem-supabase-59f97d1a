import { useState, useEffect } from "react";
import { useConsent, ConsentState } from "@/contexts/ConsentContext";
import { useTranslation } from "react-i18next";
import { X, Shield, Lock, BarChart3, Megaphone, Sparkles, ExternalLink } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const GOOGLE_VENDOR_ID = 755;

interface VendorInfo {
  id: number;
  name: string;
  policyUrl: string;
}

const DISCLOSED_VENDORS: VendorInfo[] = [
  { id: GOOGLE_VENDOR_ID, name: "Google Advertising Products", policyUrl: "https://policies.google.com/privacy" },
  { id: 52, name: "Lotame Solutions, Inc.", policyUrl: "https://www.lotame.com/about-lotame/privacy/" },
  { id: 69, name: "OpenX Technologies, Inc.", policyUrl: "https://www.openx.com/privacy-center/" },
  { id: 32, name: "Xandr (Microsoft)", policyUrl: "https://about.ads.microsoft.com/en-us/solutions/xandr/xandr-premium-programmatic-advertising" },
];

const categories = [
  {
    key: "necessary" as const,
    icon: Lock,
    locked: true,
  },
  {
    key: "analytics" as const,
    icon: BarChart3,
    locked: false,
  },
  {
    key: "advertising" as const,
    icon: Megaphone,
    locked: false,
  },
  {
    key: "personalization" as const,
    icon: Sparkles,
    locked: false,
  },
];

export function ConsentPreferencesModal() {
  const { showPreferences, closePreferences, consent, savePreferences, acceptAll, rejectAll } = useConsent();
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState({
    analytics: false,
    advertising: false,
    personalization: false,
  });
  const [showVendors, setShowVendors] = useState(false);

  useEffect(() => {
    if (consent) {
      setPrefs({
        analytics: consent.analytics,
        advertising: consent.advertising,
        personalization: consent.personalization,
      });
    }
  }, [consent, showPreferences]);

  if (!showPreferences) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closePreferences} />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              {t("consent.preferencesTitle", "Privacy Preferences")}
            </h2>
          </div>
          <button
            onClick={closePreferences}
            className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            {t(
              "consent.preferencesDesc",
              "Choose which types of cookies you want to allow. Your preferences will be saved for 12 months."
            )}
          </p>

          {/* TCF Info Badge */}
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
            <Shield className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">
              {t("consent.tcfCompliant", "IAB TCF v2.3 Compliant • Consent string generated")}
            </span>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            {categories.map((cat) => (
              <div
                key={cat.key}
                className="border border-border rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <cat.icon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      {t(`consent.cat.${cat.key}`, cat.key)}
                    </span>
                  </div>
                  {cat.locked ? (
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {t("consent.alwaysOn", "Always on")}
                    </span>
                  ) : (
                    <Switch
                      checked={prefs[cat.key]}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, [cat.key]: v }))}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t(`consent.catDesc.${cat.key}`, "")}
                </p>
              </div>
            ))}
          </div>

          {/* Vendor Disclosure Section */}
          <div className="border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setShowVendors(!showVendors)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary/50 transition-colors"
            >
              <span>{t("consent.vendorDisclosure", "Vendor Disclosure")} ({DISCLOSED_VENDORS.length})</span>
              <span className="text-xs text-muted-foreground">{showVendors ? "▲" : "▼"}</span>
            </button>
            {showVendors && (
              <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground mb-2">
                  {t(
                    "consent.vendorDesc",
                    "The following vendors are disclosed as part of IAB TCF v2.3 compliance:"
                  )}
                </p>
                {DISCLOSED_VENDORS.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <span className="text-sm text-foreground">{vendor.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">ID: {vendor.id}</span>
                    </div>
                    <a
                      href={vendor.policyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                    >
                      {t("consent.privacyPolicy", "Policy")}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-border flex flex-wrap gap-2 justify-end">
          <button
            onClick={rejectAll}
            className="px-4 py-2 text-sm font-medium border border-border rounded-full text-foreground hover:bg-secondary transition-colors"
          >
            {t("consent.rejectAll", "Reject All")}
          </button>
          <button
            onClick={acceptAll}
            className="px-4 py-2 text-sm font-medium border border-border rounded-full text-foreground hover:bg-secondary transition-colors"
          >
            {t("consent.acceptAll", "Accept All")}
          </button>
          <button
            onClick={() => savePreferences(prefs)}
            className="px-5 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all"
          >
            {t("consent.savePreferences", "Save Preferences")}
          </button>
        </div>
      </div>
    </div>
  );
}
