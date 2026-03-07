import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConsent } from "@/contexts/ConsentContext";
import { useTheme } from "next-themes";
import { Phone, MessageCircle, Mail, MapPin } from "lucide-react";
import logoLight from "@/assets/logo-home-garden-light.png";
import logoDark from "@/assets/logo-home-garden.png";
import { SocialLinks } from "@/components/SocialLinks";
import { useSocialLinks } from "@/hooks/use-social-links";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";

export function Footer() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const { hasActiveLinks } = useSocialLinks();
  const { openPreferences } = useConsent();

  const footerLinks = [
    { name: t("nav.home"), path: "/" },
    { name: t("nav.blog"), path: "/blog" },
    { name: t("nav.about"), path: "/about" },
    { name: t("nav.contact"), path: "/contact" },
  ];

  const legalLinks = [
    { name: t("footer.privacyPolicy"), path: "/privacy-policy" },
    { name: t("footer.termsOfUse"), path: "/terms-of-use" },
    { name: t("footer.cookiePolicy"), path: "/cookie-policy" },
  ];

  // Use light logo as default when theme is not yet resolved
  const logoSrc = resolvedTheme === 'dark' ? logoDark : logoLight;
  const showLogo = resolvedTheme !== undefined;

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-6">
            <Link to="/" className="inline-block">
              <img
                src={logoSrc}
                alt="HomeGarden"
                width={200}
                height={80}
                loading="lazy"
                className={`h-20 w-auto ${showLogo ? 'opacity-100' : 'opacity-0'}`}
              />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              {t("footer.description")}
            </p>

            {/* Newsletter */}
            <NewsletterForm source="footer" />

            {/* Social Media Icons */}
            {hasActiveLinks && (
              <div className="space-y-3 mt-6">
                <p className="text-sm font-semibold text-foreground">
                  {t("footer.followUs")}
                </p>
                <SocialLinks iconClassName="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {t("footer.links")}
            </h4>
            <nav className="flex flex-col space-y-3">
              {footerLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {t("footer.legal")}
            </h4>
            <nav className="flex flex-col space-y-3">
              {legalLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Contact Info & Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-8 border-t border-border">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {t("contact.label")}
            </h4>
            <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
              <a href="tel:+5531973290745" className="inline-flex items-center gap-2 hover:text-primary transition-colors">
                <Phone className="w-4 h-4 text-primary" />
                (31) 97329-0745
              </a>
              <a href="https://wa.me/5531973290745" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-primary transition-colors">
                <MessageCircle className="w-4 h-4 text-primary" />
                (31) 97329-0745
              </a>
              <a href="mailto:criandoconteudomkt@gmail.com" className="inline-flex items-center gap-2 hover:text-primary transition-colors">
                <Mail className="w-4 h-4 text-primary" />
                criandoconteudomkt@gmail.com
              </a>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {t("footer.findUs")}
            </h4>
            <div className="inline-flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
              <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Rua Antonio Teixeira Dias S/N, Bairro Teixeira Dias - Belo Horizonte, MG - CEP: 30642270</span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col items-center gap-2">
          <button
            onClick={openPreferences}
            className="text-sm text-primary hover:underline transition-colors"
          >
            🔒 {t("consent.footerLink", "Privacy & Cookie Settings")}
          </button>
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} HomeGarden. {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
