import { useConsent } from "@/contexts/ConsentContext";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";

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
        <div className="bg-card border border-border rounded-3xl p-6 shadow-2xl w-[340px] max-w-[calc(100vw-3rem)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-foreground">
              {t("consent.cardTitle", "Controle sua privacidade")}
            </h3>
            <span className="text-xs text-muted-foreground font-medium">AdOpt</span>
          </div>

          {/* Message */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {t("consent.cardMessage", "Nosso site usa cookies para melhorar a navegação.")}
          </p>

          {/* Links */}
          <div className="flex items-center justify-center gap-2 text-xs mb-5 flex-wrap">
            <Link to="/privacy-policy" className="text-primary hover:underline font-medium">
              {t("consent.privacyPolicy", "Política de Privacidade")}
            </Link>
            <span className="text-muted-foreground">–</span>
            <Link to="/terms-of-use" className="text-primary hover:underline font-medium">
              {t("consent.termsOfUse", "Termos de uso")}
            </Link>
            <span className="text-muted-foreground">–</span>
            <button onClick={rejectAll} className="text-primary hover:underline font-medium">
              {t("consent.optOut", "Opt-out")}
            </button>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={openPreferences}
              className="text-sm font-medium text-foreground underline underline-offset-2 hover:text-primary transition-colors"
            >
              {t("consent.customize", "Customizar")}
            </button>
            <button
              onClick={rejectAll}
              className="flex-1 px-4 py-2.5 text-sm font-medium border border-border rounded-full text-foreground hover:bg-secondary transition-colors"
            >
              {t("consent.rejectAll", "Rejeitar")}
            </button>
            <button
              onClick={acceptAll}
              className="flex-1 px-4 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all"
            >
              {t("consent.acceptAll", "Aceitar")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
