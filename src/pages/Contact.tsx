import React, { useState, useCallback, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, MapPin, Globe, User, Shield, Send, RefreshCw, MessageCircle, Clock, Sparkles, ArrowRight, Phone, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import contactHero from "@/assets/contact-hero.jpg";
import { Link } from "react-router-dom";

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .max(255, "E-mail deve ter no máximo 255 caracteres"),
  subject: z
    .string()
    .min(1, "Selecione um assunto"),
  message: z
    .string()
    .trim()
    .min(10, "Mensagem deve ter pelo menos 10 caracteres")
    .max(2000, "Mensagem deve ter no máximo 2000 caracteres"),
  captcha: z
    .string()
    .min(1, "Digite a resposta"),
  honeypot: z.string().max(0).optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const Contact = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaNumbers, setCaptchaNumbers] = useState(() => generateCaptcha());

  function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return { num1, num2, answer: num1 + num2 };
  }

  const refreshCaptcha = useCallback(() => {
    setCaptchaNumbers(generateCaptcha());
    form.setValue("captcha", "");
  }, []);

  const subjectOptions = useMemo(() => [
    { value: "question", label: t("contact.subjectOptions.question") },
    { value: "suggestion", label: t("contact.subjectOptions.suggestion") },
    { value: "partnership", label: t("contact.subjectOptions.partnership") },
    { value: "problem", label: t("contact.subjectOptions.problem") },
    { value: "other", label: t("contact.subjectOptions.other") },
  ], [t]);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      captcha: "",
      honeypot: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    if (data.honeypot && data.honeypot.length > 0) {
      console.log("Bot detected via honeypot");
      return;
    }

    const userAnswer = parseInt(data.captcha, 10);
    if (isNaN(userAnswer) || userAnswer !== captchaNumbers.answer) {
      toast.error(t("contact.captchaError"));
      refreshCaptcha();
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await invokeEdgeFunction("send-contact-email", {
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
      });

      if (error) {
        throw error;
      }

      toast.success(t("contact.success"), {
        description: t("contact.successDesc"),
      });

      form.reset();
      refreshCaptcha();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t("contact.error"), {
        description: t("contact.errorDesc"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      title: t("contact.email"),
      value: "mktcriandoconteudo@gmail.com",
      href: "mailto:mktcriandoconteudo@gmail.com",
    },
    {
      icon: Globe,
      title: t("contact.website"),
      value: "homegardenmanual.com",
      href: "https://homegardenmanual.com",
    },
    {
      icon: MapPin,
      title: t("contact.location"),
      value: "Belo Horizonte, MG",
      href: null,
    },
  ];

  const features = [
    {
      icon: MessageCircle,
      title: t("contact.feature1Title", "Resposta Rápida"),
      description: t("contact.feature1Desc", "Respondemos todas as mensagens em até 24 horas úteis."),
    },
    {
      icon: Heart,
      title: t("contact.feature2Title", "Suporte Dedicado"),
      description: t("contact.feature2Desc", "Nossa equipe está pronta para ajudar você."),
    },
    {
      icon: Shield,
      title: t("contact.feature3Title", "Privacidade Protegida"),
      description: t("contact.feature3Desc", "Seus dados estão seguros conforme a LGPD."),
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src={contactHero}
            alt="Contact us"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 lg:px-12 text-center py-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-8 animate-fade-in">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">{t("contact.label")}</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight max-w-4xl mx-auto mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {t("contact.heroTitle", "Vamos Criar Algo")}
            <span className="text-primary block mt-2">{t("contact.heroHighlight", "Incrível Juntos")}</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {t("contact.heroDescription", "Estamos aqui para ouvir suas ideias, responder suas dúvidas e ajudar você a transformar seu espaço.")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button size="lg" className="rounded-full px-8 gap-2 shadow-lg shadow-primary/25" onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}>
              {t("contact.heroButton", "Enviar Mensagem")}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Link to="/blog">
              <Button size="lg" variant="outline" className="rounded-full px-8">
                {t("contact.exploreBlog", "Explorar Blog")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Methods Strip */}
      <section className="py-8 bg-secondary/30 border-y border-border/50">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <div key={index} className="flex items-center gap-4 justify-center md:justify-start">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <method.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{method.title}</p>
                  {method.href ? (
                    <a
                      href={method.href}
                      target={method.href.startsWith('http') ? '_blank' : undefined}
                      rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {method.value}
                    </a>
                  ) : (
                    <p className="font-medium text-foreground">{method.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 mx-auto group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section id="contact-form" className="py-16 lg:py-24 bg-gradient-to-b from-secondary/20 to-transparent">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

            {/* Left Side - Info */}
            <div className="space-y-8">
              <div>
                <span className="text-primary font-semibold tracking-wide uppercase text-sm">
                  {t("contact.infoLabel", "Entre em Contato")}
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mt-4">
                  {t("contact.infoTitle", "Adoramos Ouvir Você")}
                </h2>
                <p className="text-muted-foreground mt-4 leading-relaxed">
                  {t("contact.infoDescription", "Seja para tirar dúvidas, sugerir temas, propor parcerias ou simplesmente trocar ideias sobre decoração e jardinagem - estamos aqui para você.")}
                </p>
              </div>

              {/* Responsible Person Card */}
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("contact.responsible")}</p>
                      <p className="text-xl font-bold text-foreground">Keven C. Vieira</p>
                      <p className="text-sm text-primary">Home Garden Manual</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Response Time */}
              <div className="flex items-center gap-4 p-6 rounded-2xl bg-primary/5 border border-primary/20">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t("contact.responseTime", "Tempo de Resposta")}</p>
                  <p className="text-sm text-muted-foreground">{t("contact.responseTimeDesc", "Normalmente respondemos em até 24 horas úteis")}</p>
                </div>
              </div>

              {/* LGPD Notice */}
              <div className="flex items-start gap-4 p-6 rounded-2xl bg-card border border-border/50">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">LGPD</p>
                  <p className="text-sm text-muted-foreground">
                    {t("contact.lgpdNotice")}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="relative">
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/10 rounded-3xl -z-10 hidden lg:block" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-primary/5 rounded-2xl -z-10 hidden lg:block" />

              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-xl">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-foreground mb-6">
                    {t("contact.formTitle")}
                  </h3>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      {/* Honeypot */}
                      <input
                        type="text"
                        name="honeypot"
                        {...form.register("honeypot")}
                        style={{ display: "none" }}
                        tabIndex={-1}
                        autoComplete="off"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("contact.nameLabel")}</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={t("contact.namePlaceholder")}
                                  className="h-12 bg-background/50"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("contact.emailLabel")}</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder={t("contact.emailPlaceholder")}
                                  className="h-12 bg-background/50"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("contact.subjectLabel")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 bg-background/50">
                                  <SelectValue placeholder={t("contact.subjectPlaceholder")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {subjectOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("contact.messageLabel")}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={t("contact.messagePlaceholder")}
                                className="min-h-[140px] resize-none bg-background/50"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* CAPTCHA */}
                      <FormField
                        control={form.control}
                        name="captcha"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("contact.captchaLabel")}</FormLabel>
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 px-4 py-3 bg-muted rounded-xl font-mono text-lg select-none">
                                {captchaNumbers.num1} + {captchaNumbers.num2} =
                              </div>
                              <FormControl>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  placeholder="?"
                                  className="w-20 h-12 text-center bg-background/50"
                                  {...field}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={refreshCaptcha}
                                className="flex-shrink-0 h-12 w-12"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full h-14 rounded-xl text-base font-semibold shadow-lg shadow-primary/25"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                            {t("contact.sending")}
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            {t("contact.submit")}
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.15),transparent_50%)]" />

            <div className="relative z-10 py-16 lg:py-20 px-8 lg:px-16 text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                {t("contact.ctaTitle", "Prefere Explorar Primeiro?")}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                {t("contact.ctaDescription", "Descubra centenas de artigos sobre decoração, jardinagem e design de interiores em nosso blog.")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/blog">
                  <Button size="lg" className="rounded-full px-8 gap-2 shadow-lg shadow-primary/25">
                    {t("contact.ctaButton", "Explorar Blog")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline" className="rounded-full px-8">
                    {t("contact.ctaAbout", "Sobre Nós")}
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

export default Contact;
