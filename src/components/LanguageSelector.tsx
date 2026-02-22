import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const languages = [
  { code: "pt-BR", name: "Português", flag: "🇧🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
];

interface LanguageSelectorProps {
  mobile?: boolean;
}

export function LanguageSelector({ mobile = false }: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  if (mobile) {
    return (
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-muted-foreground">{t("common.language")}</span>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-sm"
          >
            <span>{currentLanguage.flag}</span>
            <span>{currentLanguage.name}</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
          </button>

          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-40 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors",
                    lang.code === currentLanguage.code && "bg-secondary"
                  )}
                >
                  <span>{lang.flag}</span>
                  <span className="flex-1 text-left">{lang.name}</span>
                  {lang.code === currentLanguage.code && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-full hover:bg-primary/90 transition-all hover:scale-105"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4" />
        <span>{currentLanguage.code.split("-")[0].toUpperCase()}</span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-44 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-colors",
                  lang.code === currentLanguage.code && "bg-secondary"
                )}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.name}</span>
                {lang.code === currentLanguage.code && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
