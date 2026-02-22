import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { invokeEdgeFunction } from '@/lib/edge-functions';
import { toast } from 'sonner';

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

  // Fetch existing conclusion
  const fetchConclusion = useCallback(async () => {
    if (!articleId) return null;

    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('article_emotional_conclusions')
        .select('*')
        .eq('article_id', articleId)
        .maybeSingle();

      if (error) {
        console.log('[useEmotionalConclusion] Fetch error:', error);
        return null;
      }

      setConclusion(data || null);
      return data || null;
    } catch (err) {
      console.error('[useEmotionalConclusion] Error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [articleId]);

  // Generate new conclusion via Edge Function
  const generateConclusion = useCallback(async (articleTitle?: string) => {
    if (!articleId) {
      toast.error('ID do artigo não encontrado');
      return null;
    }

    setIsGenerating(true);
    try {
      // Get the theme - use provided title or fetch from article
      let theme = articleTitle;

      if (!theme) {
        const { data: articles } = await (supabase as any)
          .from('content_articles')
          .select('title, main_subject')
          .eq('id', articleId)
          .maybeSingle();

        theme = articles?.main_subject || articles?.title;
      }

      if (!theme) {
        toast.error('Não foi possível determinar o tema do artigo');
        return null;
      }

      // Call the edge function
      console.log('[useEmotionalConclusion] Calling edge function with theme:', theme);

      const { data, error } = await invokeEdgeFunction('generate-emotional-conclusion', {
        theme,
        article_id: articleId,
      });

      if (error) throw error;

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

      // Fallback: Try to save directly if edge function didn't save
      console.log('[useEmotionalConclusion] Attempting fallback save');
      const { error: saveError } = await (supabase as any)
        .from('article_emotional_conclusions')
        .upsert({
          article_id: articleId,
          conclusion_text: data.emotional_text,
          generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'article_id' });

      if (saveError) {
        console.error('[useEmotionalConclusion] Fallback save error:', saveError);
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

  // Update conclusion text
  const updateConclusion = useCallback(async (newText: string) => {
    if (!articleId) return false;

    try {
      const { error } = await (supabase as any)
        .from('article_emotional_conclusions')
        .update({
          conclusion_text: newText,
          updated_at: new Date().toISOString(),
        })
        .eq('article_id', articleId);

      if (error) {
        console.error('[useEmotionalConclusion] Update error:', error);
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

  // Delete conclusion
  const deleteConclusion = useCallback(async () => {
    if (!articleId) return false;

    try {
      const { error } = await (supabase as any)
        .from('article_emotional_conclusions')
        .delete()
        .eq('article_id', articleId);

      if (error) {
        console.error('[useEmotionalConclusion] Delete error:', error);
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
