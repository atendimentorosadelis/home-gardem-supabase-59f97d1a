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
        console.error('[useEmotionalConclusion] Fetch error:', error);
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

  const generateConclusion = useCallback(async (articleTitle?: string) => {
    if (!articleId) {
      toast.error('ID do artigo não encontrado');
      return null;
    }
    setIsGenerating(true);
    try {
      let theme = articleTitle;
      if (!theme) {
        const { data: articles } = await (supabase as any)
          .from('content_articles')
          .select('title')
          .eq('id', articleId)
          .maybeSingle();
        theme = articles?.title;
      }
      if (!theme) {
        toast.error('Não foi possível determinar o tema');
        return null;
      }

      const { data, error } = await invokeEdgeFunction('generate-emotional-conclusion', {
        theme,
        article_id: articleId,
      });

      if (error) throw error;
      if (!data?.emotional_text) {
        toast.error(data?.error || 'Erro ao gerar conclusão');
        return null;
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

  const updateConclusion = useCallback(async (newText: string) => {
    if (!articleId) return false;
    try {
      const { error } = await (supabase as any)
        .from('article_emotional_conclusions')
        .update({ conclusion_text: newText, updated_at: new Date().toISOString() })
        .eq('article_id', articleId);

      if (error) {
        toast.error('Erro ao salvar conclusão');
        return false;
      }
      setConclusion(prev => prev ? { ...prev, conclusion_text: newText, updated_at: new Date().toISOString() } : null);
      toast.success('Conclusão atualizada com sucesso!');
      return true;
    } catch (err) {
      toast.error('Erro ao salvar conclusão');
      return false;
    }
  }, [articleId]);

  const deleteConclusion = useCallback(async () => {
    if (!articleId) return false;
    try {
      const { error } = await (supabase as any)
        .from('article_emotional_conclusions')
        .delete()
        .eq('article_id', articleId);

      if (error) {
        toast.error('Erro ao excluir conclusão');
        return false;
      }
      setConclusion(null);
      toast.success('Conclusão excluída');
      return true;
    } catch (err) {
      return false;
    }
  }, [articleId]);

  return { conclusion, isLoading, isGenerating, fetchConclusion, generateConclusion, updateConclusion, deleteConclusion };
}
