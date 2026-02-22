import { useTranslation } from 'react-i18next';

export function Hero() {
  const { t } = useTranslation();
  
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-primary/10 to-background">
      <div className="container mx-auto px-4 text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground">
          {t('hero.title')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('hero.subtitle')}
        </p>
      </div>
    </section>
  );
}
