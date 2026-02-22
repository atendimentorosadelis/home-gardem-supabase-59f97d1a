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

  // Fetch existing conclusion from Supabase (xfhtixubllcdockbkbwm)
  const fetchConclusion = useCallback(async () => {
    if (!articleId) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('article_emotional_conclusions')
        .select('*')
        .eq('article_id', articleId)
        .maybeSingle();

      if (error) {
        console.error('[useEmotionalConclusion] Fetch error:', error);
        return null;
      }

      setConclusion(data);
      return data;
    } catch (err) {
      console.error('[useEmotionalConclusion] Error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [articleId]);

  // Generate new conclusion via Edge Function on xfhtixubllcdockbkbwm
  const generateConclusion = useCallback(async (articleTitle?: string) => {
    if (!articleId) {
      toast.error('ID do artigo não encontrado');
      return null;
    }

    setIsGenerating(true);
    try {
      let theme = articleTitle;

      if (!theme) {
        const { data: articleData } = await supabase
          .from('content_articles')
          .select('title, main_subject')
          .eq('id', articleId)
          .maybeSingle();

        theme = articleData?.main_subject || articleData?.title;
      }

      if (!theme) {
        toast.error('Não foi possível determinar o tema do artigo');
        return null;
      }

      console.log('[useEmotionalConclusion] Calling edge function with theme:', theme);

      const { data, error } = await invokeEdgeFunction<{
        emotional_text: string;
        saved?: boolean;
        article_id?: string;
        error?: string;
      }>('generate-emotional-conclusion', {
        theme,
        article_id: articleId,
      });

      if (error || !data?.emotional_text) {
        console.error('[useEmotionalConclusion] Edge function error:', error || data?.error);
        toast.error('Erro ao gerar conclusão emocional');
        return null;
      }

      if (data.saved) {
        console.log('[useEmotionalConclusion] Edge function saved conclusion directly');
        toast.success('Conclusão emocional gerada e salva com sucesso!');
        await fetchConclusion();
        return data.emotional_text;
      }

      // Fallback: save via supabase client if edge function didn't save
      console.log('[useEmotionalConclusion] Attempting fallback save via supabase client');
      const { error: upsertError } = await supabase
        .from('article_emotional_conclusions')
        .upsert({
          article_id: articleId,
          conclusion_text: data.emotional_text,
          generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'article_id' });

      if (upsertError) {
        console.error('[useEmotionalConclusion] Fallback save error:', upsertError);
        toast.warning('Conclusão gerada, mas não foi possível salvar.');
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
      const { error } = await supabase
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
      const { error } = await supabase
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
