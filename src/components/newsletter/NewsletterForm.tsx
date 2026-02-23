import { useState } from 'react';
import { ArrowRight, Loader2, CheckCircle, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const emailSchema = z.string().email().max(255);

interface NewsletterFormProps {
  source?: string;
  className?: string;
}

export function NewsletterForm({ source = 'footer', className = '' }: NewsletterFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    const validation = emailSchema.safeParse(email.trim());
    if (!validation.success) {
      toast({
        title: t('newsletter.invalidEmail', 'E-mail inválido'),
        description: t('newsletter.invalidEmailDesc', 'Por favor, insira um e-mail válido.'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: validation.data.toLowerCase(),
          language: i18n.language || 'pt-BR',
        } as any);

      if (error) {
        // Handle duplicate email
        if (error.code === '23505') {
          toast({
            title: t('newsletter.alreadySubscribed', 'Você já está inscrito!'),
            description: t('newsletter.alreadySubscribedDesc', 'Este e-mail já está cadastrado em nossa newsletter.'),
          });
          setIsSubscribed(true);
          return;
        }
        throw error;
      }

      setIsSubscribed(true);
      setEmail('');

      toast({
        title: t('newsletter.success', '🎉 Inscrição realizada!'),
        description: t('newsletter.successDesc', 'Você receberá nossas novidades e dicas exclusivas de jardinagem diretamente no seu e-mail.'),
      });
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast({
        title: t('newsletter.error', 'Erro ao inscrever'),
        description: t('newsletter.errorDesc', 'Ocorreu um erro. Tente novamente mais tarde.'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className={`flex items-center gap-3 p-4 bg-primary/10 rounded-full ${className}`}>
        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
        <p className="text-sm text-foreground">
          {t('newsletter.thankYou', 'Obrigado! Fique de olho na sua caixa de entrada 📬')}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Mail className="h-4 w-4" />
        {t('footer.newsletter', 'Receba nossas novidades')}
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('footer.newsletterPlaceholder', 'Seu melhor e-mail')}
          className="flex-1 px-4 py-3 text-sm bg-secondary border border-border rounded-full placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          required
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-primary text-primary-foreground font-semibold text-sm rounded-full hover:bg-primary/90 transition-all hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span className="hidden sm:inline">{t('footer.subscribe', 'Inscrever')}</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        {t('newsletter.privacyNote')}
      </p>
    </form>
  );
}
