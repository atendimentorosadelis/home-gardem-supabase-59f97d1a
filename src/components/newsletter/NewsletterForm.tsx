import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function NewsletterForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('newsletter_subscribers')
        .insert({ email, status: 'active' });

      if (error) {
        if (error.code === '23505') {
          toast.info('Você já está inscrito!');
        } else {
          throw error;
        }
      } else {
        toast.success('Inscrito com sucesso!');
        setEmail('');
      }
    } catch {
      toast.error('Erro ao se inscrever');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm text-muted-foreground">{t('footer.newsletterDescription')}</p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder={t('footer.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          required
        />
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        </Button>
      </div>
    </form>
  );
}
