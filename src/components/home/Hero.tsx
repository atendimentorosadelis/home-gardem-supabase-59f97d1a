import { Link } from "react-router-dom";
import { ArrowRight, Star, Home, Lightbulb, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import heroBg from "@/assets/hero-bg.jpg";
import { useParallax } from "@/hooks/use-parallax";
import { AnimatedLine } from "@/components/ui/animated-line";

export function Hero() {
  const parallaxOffset = useParallax(0.5);
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background pt-20">
      <div className="absolute -top-20 right-0 w-[80%] h-[calc(100%+10rem)] overflow-hidden z-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 dark:opacity-30 blur-[2px] scale-125 will-change-transform"
          style={{
            backgroundImage: `url(${heroBg})`,
            transform: `translateY(${-50 + parallaxOffset}px)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-background/30 to-background" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background" />
      </div>

      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-glow z-[1]" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-primary/15 rounded-full blur-[100px] animate-pulse-glow z-[1]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] z-[1]" />

      <div className="relative z-10 container mx-auto px-6 lg:px-12 py-20">
        <div className="relative z-10 max-w-4xl mx-auto text-center md:text-left space-y-8">
          <AnimatedLine delay={0}>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full border border-border">
              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">{t("hero.badgeNew")}</span>
              <span className="text-sm text-muted-foreground">{t("hero.badgeText")}</span>
            </span>
          </AnimatedLine>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight text-left">
            <span className="block will-change-transform animate-slide-fade-in" style={{ animationDelay: '150ms' }}>{t("hero.titleLine1")}</span>
            <span className="block will-change-transform animate-slide-fade-in" style={{ animationDelay: '300ms' }}>
              <span className="text-primary">{t("hero.titleLine2")}</span> {t("hero.titleLine3")}
            </span>
          </h1>

          <AnimatedLine delay={500}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">{t("hero.description")}</p>
          </AnimatedLine>

          <AnimatedLine delay={650}>
            <div className="flex items-center justify-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (<Star key={i} className="w-5 h-5 fill-primary text-primary" />))}
              </div>
              <span className="text-sm text-muted-foreground">
                {t("hero.trustedBy")} <span className="text-foreground font-semibold">10.000+</span> {t("hero.enthusiasts")}
              </span>
            </div>
          </AnimatedLine>

          <AnimatedLine delay={800}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/blog" className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold text-base rounded-full hover:bg-primary/90 transition-all hover:scale-105 hover:gap-3">
                {t("hero.ctaPrimary")}
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/about" className="inline-flex items-center gap-2 px-8 py-4 border border-border text-foreground font-semibold text-base rounded-full hover:bg-secondary transition-colors">
                {t("hero.ctaSecondary")}
              </Link>
            </div>
          </AnimatedLine>

          <AnimatedLine delay={950}>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border">
                <Home className="w-4 h-4 text-primary" /><span className="text-sm text-muted-foreground">{t("hero.decorIdeas")}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border">
                <Lightbulb className="w-4 h-4 text-primary" /><span className="text-sm text-muted-foreground">{t("hero.diyGuides")}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border">
                <Users className="w-4 h-4 text-primary" /><span className="text-sm text-muted-foreground">{t("hero.dailyInspiration")}</span>
              </div>
            </div>
          </AnimatedLine>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
