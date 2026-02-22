import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Supabase EXTERNO - lhtetfcujdzulfyekiub (produção)
const EXTERNAL_SUPABASE_URL = 'https://lhtetfcujdzulfyekiub.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxodGV0ZmN1amR6dWxmeWVraXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NTMzNTYsImV4cCI6MjA4NDQyOTM1Nn0.NOHNkC65PjsBql23RNa5KU3NauN6C3BmPrM02lETBoc';

// Lovable Cloud Edge Function URL (proxy para usar secrets do external)
const LOVABLE_CLOUD_FUNCTIONS_URL = 'https://gcdwdjacrxmdsciwqtlc.supabase.co/functions/v1';
const LOVABLE_CLOUD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZHdkamFjcnhtZHNjaXdxdGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDIxOTcsImV4cCI6MjA4NDQxODE5N30.mxryA4KPolNzIZQXo-ZSyp18n8OliIrhabKpLljf1vU';

export interface EmotionalConclusion {
  id: string;
  article_id: string;
  conclusion_text: string;
  generated_at: string;
  updated_at: string;
}

export function useEmotionalConclusion(articleId: string | undefined) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conclusion, setConclusion] = useState<EmotionalConclusion | null>(null);

  // Fetch existing conclusion from EXTERNAL Supabase
  const fetchConclusion = useCallback(async () => {
    if (!articleId) return null;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${EXTERNAL_SUPABASE_URL}/rest/v1/article_emotional_conclusions?article_id=eq.${articleId}&select=*`,
        {
          headers: {
            'apikey': EXTERNAL_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${EXTERNAL_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.log('[useEmotionalConclusion] Fetch response:', response.status);
        return null;
      }

      const data = await response.json();
      const result = data?.[0] || null;

      setConclusion(result);
      return result;
    } catch (err) {
      console.error('[useEmotionalConclusion] Error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [articleId]);

  // Generate new conclusion via Edge Function (Lovable Cloud proxy -> saves to External)
  const generateConclusion = useCallback(async (articleTitle?: string) => {
    if (!articleId) {
      toast.error('ID do artigo não encontrado');
      return null;
    }

    setIsGenerating(true);
    try {
      // Get the theme - use provided title or fetch from article (External Supabase)
      let theme = articleTitle;

      if (!theme) {
        const articleResponse = await fetch(
          `${EXTERNAL_SUPABASE_URL}/rest/v1/content_articles?id=eq.${articleId}&select=title,main_subject`,
          {
            headers: {
              'apikey': EXTERNAL_SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
            },
          }
        );

        if (articleResponse.ok) {
          const articles = await articleResponse.json();
          theme = articles?.[0]?.main_subject || articles?.[0]?.title;
        }
      }

      if (!theme) {
        toast.error('Não foi possível determinar o tema do artigo');
        return null;
      }

      // Call the Lovable Cloud edge function (has EXTERNAL_SUPABASE_SERVICE_KEY configured)
      console.log('[useEmotionalConclusion] Calling edge function with theme:', theme);

      const response = await fetch(`${LOVABLE_CLOUD_FUNCTIONS_URL}/generate-emotional-conclusion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LOVABLE_CLOUD_ANON_KEY}`,
          'apikey': LOVABLE_CLOUD_ANON_KEY,
        },
        body: JSON.stringify({
          theme,
          article_id: articleId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useEmotionalConclusion] Edge function error:', response.status, errorText);
        throw new Error(`Edge function error: ${response.status}`);
      }

      const data = await response.json() as {
        emotional_text: string;
        saved?: boolean;
        article_id?: string;
        error?: string;
      };

      if (!data?.emotional_text) {
        const errorMessage = data?.error || 'Erro ao gerar conclusão';
        toast.error(errorMessage);
        return null;
      }

      if (data.saved) {
        console.log('[useEmotionalConclusion] Edge function saved conclusion directly');
        toast.success('Conclusão emocional gerada e salva com sucesso!');
        await fetchConclusion();
        return data.emotional_text;
      }

      // Fallback: Try to save via REST API if edge function didn't save
      console.log('[useEmotionalConclusion] Attempting fallback save via REST API');
      const session = await supabase.auth.getSession();
      const saveResponse = await fetch(
        `${EXTERNAL_SUPABASE_URL}/rest/v1/article_emotional_conclusions`,
        {
          method: 'POST',
          headers: {
            'apikey': EXTERNAL_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token || EXTERNAL_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            article_id: articleId,
            conclusion_text: data.emotional_text,
            generated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        console.error('[useEmotionalConclusion] Fallback save error:', saveResponse.status, errorText);
        toast.warning('Conclusão gerada, mas não foi possível salvar. Verifique as permissões.');
        return data.emotional_text;
      }

      toast.success('Conclusão emocional gerada com sucesso!');
      await fetchConclusion();

      return data.emotional_text;
    } catch (err) {
      console.error('[useEmotionalConclusion] Generate error:', err);
      toast.error('Erro ao gerar conclusão emocional');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [articleId, fetchConclusion]);

  // Update conclusion text on EXTERNAL Supabase
  const updateConclusion = useCallback(async (newText: string) => {
    if (!articleId) return false;

    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${EXTERNAL_SUPABASE_URL}/rest/v1/article_emotional_conclusions?article_id=eq.${articleId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': EXTERNAL_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token || EXTERNAL_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conclusion_text: newText,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        console.error('[useEmotionalConclusion] Update error:', response.status);
        toast.error('Erro ao salvar conclusão');
        return false;
      }

      setConclusion(prev => prev ? { ...prev, conclusion_text: newText, updated_at: new Date().toISOString() } : null);
      toast.success('Conclusão atualizada com sucesso!');
      return true;
    } catch (err) {
      console.error('[useEmotionalConclusion] Update error:', err);
      toast.error('Erro ao salvar conclusão');
      return false;
    }
  }, [articleId]);

  // Delete conclusion from EXTERNAL Supabase
  const deleteConclusion = useCallback(async () => {
    if (!articleId) return false;

    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${EXTERNAL_SUPABASE_URL}/rest/v1/article_emotional_conclusions?article_id=eq.${articleId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': EXTERNAL_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token || EXTERNAL_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('[useEmotionalConclusion] Delete error:', response.status);
        toast.error('Erro ao excluir conclusão');
        return false;
      }

      setConclusion(null);
      toast.success('Conclusão excluída');
      return true;
    } catch (err) {
      console.error('[useEmotionalConclusion] Error:', err);
      return false;
    }
  }, [articleId]);

  return {
    conclusion,
    isLoading,
    isGenerating,
    fetchConclusion,
    generateConclusion,
    updateConclusion,
    deleteConclusion,
  };
}
