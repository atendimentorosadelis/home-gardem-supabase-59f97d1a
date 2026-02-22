import React, { useState, useCallback, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, MapPin, Globe, User, Shield, Send, RefreshCw, MessageCircle, Clock, Sparkles, ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import { Link } from "react-router-dom";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  subject: z.string().min(1, "Selecione um assunto"),
  message: z.string().trim().min(10, "Mensagem deve ter pelo menos 10 caracteres").max(2000),
  captcha: z.string().min(1, "Digite a resposta"),
  honeypot: z.string().max(0).optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const Contact = () => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaNumbers, setCaptchaNumbers] = useState(() => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return { num1, num2, answer: num1 + num2 };
  });

  const refreshCaptcha = useCallback(() => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaNumbers({ num1, num2, answer: num1 + num2 });
    form.setValue("captcha", "");
  }, []);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "", captcha: "", honeypot: "" },
  });

  const onSubmit = async (data: ContactFormData) => {
    if (data.honeypot && data.honeypot.length > 0) return;
    const userAnswer = parseInt(data.captcha, 10);
    if (isNaN(userAnswer) || userAnswer !== captchaNumbers.answer) {
      toast.error(t("contact.captchaError")); refreshCaptcha(); return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await invokeEdgeFunction("send-contact-email", { name: data.name, email: data.email, subject: data.subject, message: data.message });
      if (error) throw error;
      toast.success(t("contact.success")); form.reset(); refreshCaptcha();
    } catch { toast.error(t("contact.error")); } finally { setIsSubmitting(false); }
  };

  const contactMethods = [
    { icon: Mail, title: t("contact.email"), value: "mktcriandoconteudo@gmail.com", href: "mailto:mktcriandoconteudo@gmail.com" },
    { icon: Globe, title: t("contact.website"), value: "homegardenmanual.com", href: "https://homegardenmanual.com" },
    { icon: MapPin, title: t("contact.location"), value: "Belo Horizonte, MG", href: null },
  ];

  const features = [
    { icon: MessageCircle, title: t("contact.feature1Title", "Resposta Rápida"), description: t("contact.feature1Desc", "Respondemos em até 24 horas úteis.") },
    { icon: Heart, title: t("contact.feature2Title", "Suporte Dedicado"), description: t("contact.feature2Desc", "Nossa equipe está pronta para ajudar.") },
    { icon: Shield, title: t("contact.feature3Title", "Privacidade Protegida"), description: t("contact.feature3Desc", "Seus dados estão seguros conforme a LGPD.") },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background/70 to-background" />
        <div className="relative z-10 container mx-auto px-6 lg:px-12 text-center py-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">{t("contact.label")}</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight max-w-4xl mx-auto mb-6">
            {t("contact.heroTitle", "Vamos Criar Algo")}
            <span className="text-primary block mt-2">{t("contact.heroHighlight", "Incrível Juntos")}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t("contact.heroDescription", "Estamos aqui para ouvir suas ideias.")}
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-8 bg-secondary/30 border-y border-border/50">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactMethods.map((method, i) => (
              <div key={i} className="flex items-center gap-4 justify-center md:justify-start">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><method.icon className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">{method.title}</p>
                  {method.href ? <a href={method.href} className="font-medium text-foreground hover:text-primary transition-colors">{method.value}</a> : <p className="font-medium text-foreground">{method.value}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="group p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 mx-auto"><feature.icon className="h-7 w-7 text-primary" /></div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="py-16 lg:py-24 bg-gradient-to-b from-secondary/20 to-transparent">
        <div className="container mx-auto px-6 lg:px-12 max-w-2xl">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-xl">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-foreground mb-6">{t("contact.formTitle")}</h3>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <input type="text" {...form.register("honeypot")} style={{ display: "none" }} tabIndex={-1} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("contact.nameLabel")}</label>
                    <Input placeholder={t("contact.namePlaceholder")} className="h-12" {...form.register("name")} />
                    {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("contact.emailLabel")}</label>
                    <Input type="email" placeholder={t("contact.emailPlaceholder")} className="h-12" {...form.register("email")} />
                    {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("contact.subjectLabel")}</label>
                  <select {...form.register("subject")} className="w-full h-12 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="">{t("contact.subjectPlaceholder")}</option>
                    <option value="question">{t("contact.subjectOptions.question")}</option>
                    <option value="suggestion">{t("contact.subjectOptions.suggestion")}</option>
                    <option value="partnership">{t("contact.subjectOptions.partnership")}</option>
                    <option value="other">{t("contact.subjectOptions.other")}</option>
                  </select>
                  {form.formState.errors.subject && <p className="text-xs text-destructive">{form.formState.errors.subject.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("contact.messageLabel")}</label>
                  <textarea placeholder={t("contact.messagePlaceholder")} className="w-full min-h-[140px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none" {...form.register("message")} />
                  {form.formState.errors.message && <p className="text-xs text-destructive">{form.formState.errors.message.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("contact.captchaLabel")}</label>
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-3 bg-muted rounded-xl font-mono text-lg select-none">{captchaNumbers.num1} + {captchaNumbers.num2} =</div>
                    <Input type="text" inputMode="numeric" placeholder="?" className="w-20 h-12 text-center" {...form.register("captcha")} />
                    <Button type="button" variant="ghost" size="icon" onClick={refreshCaptcha} className="h-12 w-12"><RefreshCw className="w-4 h-4" /></Button>
                  </div>
                </div>
                <Button type="submit" size="lg" className="w-full h-14 rounded-xl" disabled={isSubmitting}>
                  {isSubmitting ? <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />{t("contact.sending")}</> : <><Send className="w-5 h-5 mr-2" />{t("contact.submit")}</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20">
            <div className="relative z-10 py-16 px-8 lg:px-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{t("contact.ctaTitle", "Prefere Explorar Primeiro?")}</h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/blog"><Button size="lg" className="rounded-full px-8 gap-2">{t("contact.ctaButton", "Explorar Blog")}<ArrowRight className="h-4 w-4" /></Button></Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
