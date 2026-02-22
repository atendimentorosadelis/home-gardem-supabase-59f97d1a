import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { invokeEdgeFunction } from '@/lib/edge-functions';
import { useToast } from '@/hooks/use-toast';

interface ArticleData { id: string; title: string; slug: string; excerpt?: string | null; category?: string | null; cover_image?: string | null; }

export const useSendNewsletter = () => {
  const { toast } = useToast();

  const checkAutoSendEnabled = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await (supabase as any).from('site_settings').select('value').eq('key', 'newsletter_auto_send').single();
      if (error && error.code !== 'PGRST116') return false;
      if (data?.value && typeof data.value === 'object') return (data.value as any).enabled ?? false;
      return false;
    } catch { return false; }
  }, []);

  const sendNewsletter = useCallback(async (article: ArticleData): Promise<boolean> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) { toast({ title: 'Erro de autenticação', variant: 'destructive' }); return false; }
      const response = await invokeEdgeFunction('send-newsletter', { articleId: article.id, articleTitle: article.title, articleSlug: article.slug, articleExcerpt: article.excerpt, articleCategory: article.category, coverImage: article.cover_image }, true);
      if (response.error) { toast({ title: 'Erro no envio', variant: 'destructive' }); return false; }
      if (response.data?.sent > 0) toast({ title: '📧 Newsletter enviada!', description: `${response.data.sent} inscrito(s) notificado(s).` });
      return true;
    } catch { toast({ title: 'Erro no envio', variant: 'destructive' }); return false; }
  }, [toast]);

  const sendNewsletterIfEnabled = useCallback(async (article: ArticleData): Promise<boolean> => {
    const isEnabled = await checkAutoSendEnabled();
    if (!isEnabled) return false;
    return sendNewsletter(article);
  }, [checkAutoSendEnabled, sendNewsletter]);

  return { sendNewsletter, sendNewsletterIfEnabled, checkAutoSendEnabled };
};
