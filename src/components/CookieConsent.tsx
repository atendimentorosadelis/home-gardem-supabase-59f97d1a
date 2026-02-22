import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

const COOKIE_CONSENT_KEY = "cookie-consent-accepted";

export function CookieConsent() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (hasConsent === null) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "false");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
        <button
          onClick={handleDecline}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t('cookies.decline')}
        >
          <X size={18} />
        </button>
        <div className="space-y-4 pr-6">
          <h3 className="text-base font-bold text-foreground">{t('cookies.title')}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('cookies.message')}{" "}
            <Link to="/cookie-policy" className="text-primary hover:underline">{t('cookies.policyLink')}</Link>.
          </p>
          <div className="flex gap-3">
            <button onClick={handleAccept} className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-full hover:bg-primary/90 transition-all">
              {t('cookies.accept')}
            </button>
            <button onClick={handleDecline} className="px-4 py-2.5 border border-border text-foreground font-medium text-sm rounded-full hover:bg-secondary transition-colors">
              {t('cookies.decline')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
