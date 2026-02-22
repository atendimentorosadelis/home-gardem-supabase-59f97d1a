import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { Phone, MessageCircle, Mail, MapPin } from "lucide-react";
import { SocialLinks } from "@/components/SocialLinks";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";

export function Footer() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();

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

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <Link to="/" className="inline-block">
              <span className="text-2xl font-bold text-primary">HomeGarden</span>
            </Link>
            <p className="text-muted-foreground max-w-md">
              {t("footer.description")}
            </p>
            <SocialLinks />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t("footer.navigation")}</h3>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t("footer.newsletter")}</h3>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} HomeGarden. {t("footer.allRightsReserved")}
          </p>
          <div className="flex gap-4">
            {legalLinks.map((link) => (
              <Link key={link.path} to={link.path} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
