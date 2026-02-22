import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { name: t("nav.home"), path: "/" },
    { name: t("nav.blog"), path: "/blog" },
    { name: t("nav.about"), path: "/about" },
    { name: t("nav.contact"), path: "/contact" },
  ];

  const isArticlePage = /^\/[a-z-]+\/[a-z0-9-]+$/.test(location.pathname) && !location.pathname.startsWith('/admin');

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/blog") return location.pathname === "/blog" || isArticlePage;
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    if (path === "/" && location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-24">
          <Logo />

          <nav className="hidden md:flex items-center">
            <div className="flex items-center bg-secondary/50 rounded-full px-2 py-2 gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => handleNavClick(e, item.path)}
                  className={cn(
                    "px-5 py-2 text-sm font-medium transition-all rounded-full",
                    isActive(item.path) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <LanguageSelector />
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-foreground" aria-label="Toggle menu">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden py-6 border-t border-border">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => { handleNavClick(e, item.path); setIsMenuOpen(false); }}
                  className={cn(
                    "px-4 py-3 text-base font-medium transition-colors rounded-lg",
                    isActive(item.path) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">{t("common.theme")}</span>
                <ThemeToggle />
              </div>
              <LanguageSelector mobile />
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
