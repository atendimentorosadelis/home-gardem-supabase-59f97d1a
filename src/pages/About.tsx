import { Layout } from "@/components/layout/Layout";
import { useTranslation } from "react-i18next";
import { Leaf, Heart, Lightbulb, Users, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import aboutHero from "@/assets/about-hero.jpg";
import aboutMission from "@/assets/about-mission.jpg";
import aboutInspiration from "@/assets/about-inspiration.jpg";
import aboutDesign from "@/assets/about-design.jpg";
import { useCurrency } from "@/hooks/use-currency";

const About = () => {
  const { t } = useTranslation();
  const { formatValue, symbol, isBRL } = useCurrency();

  const values = [
    {
      icon: Leaf,
      title: t('about.values.sustainability', 'Sustentabilidade'),
      description: t('about.values.sustainabilityDesc', 'Promovemos práticas ecológicas e conexão com a natureza em cada projeto.')
    },
    {
      icon: Heart,
      title: t('about.values.passion', 'Paixão'),
      description: t('about.values.passionDesc', 'Cada artigo é criado com amor e dedicação por nossa equipe apaixonada.')
    },
    {
      icon: Lightbulb,
      title: t('about.values.inspiration', 'Inspiração'),
      description: t('about.values.inspirationDesc', 'Trazemos ideias criativas e tendências para transformar seu espaço.')
    },
    {
      icon: Users,
      title: t('about.values.community', 'Comunidade'),
      description: t('about.values.communityDesc', 'Construímos uma comunidade de entusiastas que compartilham a mesma paixão.')
    }
  ];

  const stats = [
    { value: '500+', label: t('about.statsArticles', 'Artigos Publicados') },
    { value: '100K+', label: t('about.statsReaders', 'Leitores Mensais') },
    {
      // Dynamic currency formatting - shows R$ 2M+ in pt-BR or $ 364K+ in en
      value: formatValue(2000000, '+'),
      label: t('about.statsSavings', 'Em Economia Gerada')
    },
    { value: '5+', label: t('about.statsYears', 'Anos de Experiência') }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src={aboutHero}
            alt="Interior design inspiration"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 lg:px-12 text-center py-32">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">{t('about.label')}</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight max-w-4xl mx-auto mb-6">
            {t('about.heroTitle', 'Transformando Casas em')}
            <span className="text-primary block mt-2">{t('about.heroTitleHighlight', 'Lares dos Sonhos')}</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t('about.heroDescription', 'Somos apaixonados por design de interiores, jardinagem e decoração. Nossa missão é inspirar e guiar você na criação de espaços que refletem sua personalidade.')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/blog">
              <Button size="lg" className="rounded-full px-8 gap-2 shadow-lg shadow-primary/25">
                {t('about.exploreBlog', 'Explorar Blog')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="rounded-full px-8">
                {t('about.contactUs', 'Fale Conosco')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-secondary/30 border-y border-border/50">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden">
                <img
                  src={aboutMission}
                  alt="Nossa missão"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Decorative element */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/20 rounded-3xl -z-10" />
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary/10 rounded-2xl -z-10" />
            </div>

            <div className="space-y-6">
              <span className="text-primary font-semibold tracking-wide uppercase text-sm">
                {t('about.missionLabel', 'Nossa Missão')}
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                {t('about.missionTitle', 'Cultivando Beleza em Cada Espaço')}
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>{t('about.paragraph1')}</p>
                <p>{t('about.paragraph2')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-secondary/20 to-transparent">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-primary font-semibold tracking-wide uppercase text-sm">
              {t('about.valuesLabel', 'Nossos Valores')}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4">
              {t('about.valuesTitle', 'O Que Nos Move')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="group p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <value.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Grid Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1 space-y-6">
              <span className="text-primary font-semibold tracking-wide uppercase text-sm">
                {t('about.storyLabel', 'Nossa História')}
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                {t('about.storyTitle', 'De Apaixonados para Apaixonados')}
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>{t('about.storyParagraph1', 'O Home Garden Manual nasceu da paixão de transformar espaços comuns em ambientes extraordinários. Começamos como um pequeno blog e crescemos para nos tornar uma referência em decoração e jardinagem.')}</p>
                <p>{t('about.storyParagraph2', 'Hoje, nossa equipe de especialistas trabalha incansavelmente para trazer as melhores dicas, tendências e inspirações para você criar o lar dos seus sonhos.')}</p>
              </div>
              <Link to="/blog" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
                {t('about.readArticles', 'Ler Nossos Artigos')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="order-1 lg:order-2 grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                  <img
                    src={aboutInspiration}
                    alt="Inspiração"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                  <img
                    src={aboutDesign}
                    alt="Design"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.15),transparent_50%)]" />

            <div className="relative z-10 py-16 lg:py-24 px-8 lg:px-16 text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                {t('about.ctaTitle', 'Pronto para Transformar seu Espaço?')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                {t('about.ctaDescription', 'Junte-se à nossa comunidade de milhares de entusiastas de decoração e receba inspiração diária para criar o lar dos seus sonhos.')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/blog">
                  <Button size="lg" className="rounded-full px-8 gap-2 shadow-lg shadow-primary/25">
                    {t('about.ctaButton', 'Começar Agora')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
