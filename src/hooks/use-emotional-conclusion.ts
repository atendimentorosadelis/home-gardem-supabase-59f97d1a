import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const EXTERNAL_SUPABASE_URL = 'https://xfhtixubllcdockbkbwm.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmaHRpeHVibGxjZG9ja2JrYndtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MjY4ODAsImV4cCI6MjA4NzMwMjg4MH0.JRQHxGOZ-7L0C2D1m_vRmKHDfvdJaEhF3OuU32QSQFI';
const LOVABLE_CLOUD_FUNCTIONS_URL = 'https://gcdwdjacrxmdsciwqtlc.supabase.co/functions/v1';
const LOVABLE_CLOUD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZHdkamFjcnhtZHNjaXdxdGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDIxOTcsImV4cCI6MjA4NDQxODE5N30.mxryA4KPolNzIZQXo-ZSyp18n8OliIrhabKpLljf1vU';

export interface EmotionalConclusion {
  id: string; article_id: string; conclusion_text: string; generated_at: string; updated_at: string;
}

export function useEmotionalConclusion(articleId: string | undefined) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conclusion, setConclusion] = useState<EmotionalConclusion | null>(null);

  const fetchConclusion = useCallback(async () => {
    if (!articleId) return null;
    setIsLoading(true);
    try {
      const response = await fetch(`${EXTERNAL_SUPABASE_URL}/rest/v1/article_emotional_conclusions?article_id=eq.${articleId}&select=*`, {
        headers: { 'apikey': EXTERNAL_SUPABASE_ANON_KEY, 'Authorization': `Bearer ${EXTERNAL_SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) return null;
      const data = await response.json();
      const result = data?.[0] || null;
      setConclusion(result);
      return result;
    } catch (err) { console.error('[useEmotionalConclusion] Error:', err); return null; }
    finally { setIsLoading(false); }
  }, [articleId]);

  const generateConclusion = useCallback(async (articleTitle?: string) => {
    if (!articleId) { toast.error('ID do artigo não encontrado'); return null; }
    setIsGenerating(true);
    try {
      let theme = articleTitle;
      if (!theme) {
        const res = await fetch(`${EXTERNAL_SUPABASE_URL}/rest/v1/content_articles?id=eq.${articleId}&select=title,main_subject`, {
          headers: { 'apikey': EXTERNAL_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        });
        if (res.ok) { const articles = await res.json(); theme = articles?.[0]?.main_subject || articles?.[0]?.title; }
      }
      if (!theme) { toast.error('Não foi possível determinar o tema'); return null; }
      const response = await fetch(`${LOVABLE_CLOUD_FUNCTIONS_URL}/generate-emotional-conclusion`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LOVABLE_CLOUD_ANON_KEY}`, 'apikey': LOVABLE_CLOUD_ANON_KEY },
        body: JSON.stringify({ theme, article_id: articleId }),
      });
      if (!response.ok) throw new Error(`Edge function error: ${response.status}`);
      const data = await response.json();
      if (!data?.emotional_text) { toast.error(data?.error || 'Erro ao gerar conclusão'); return null; }
      toast.success('Conclusão emocional gerada com sucesso!');
      await fetchConclusion();
      return data.emotional_text;
    } catch (err) { console.error('[useEmotionalConclusion] Generate error:', err); toast.error('Erro ao gerar conclusão emocional'); return null; }
    finally { setIsGenerating(false); }
  }, [articleId, fetchConclusion]);

  const updateConclusion = useCallback(async (newText: string) => {
    if (!articleId) return false;
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(`${EXTERNAL_SUPABASE_URL}/rest/v1/article_emotional_conclusions?article_id=eq.${articleId}`, {
        method: 'PATCH', headers: { 'apikey': EXTERNAL_SUPABASE_ANON_KEY, 'Authorization': `Bearer ${session.data.session?.access_token || EXTERNAL_SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ conclusion_text: newText, updated_at: new Date().toISOString() }),
      });
      if (!response.ok) { toast.error('Erro ao salvar conclusão'); return false; }
      setConclusion(prev => prev ? { ...prev, conclusion_text: newText, updated_at: new Date().toISOString() } : null);
      toast.success('Conclusão atualizada com sucesso!');
      return true;
    } catch (err) { toast.error('Erro ao salvar conclusão'); return false; }
  }, [articleId]);

  const deleteConclusion = useCallback(async () => {
    if (!articleId) return false;
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(`${EXTERNAL_SUPABASE_URL}/rest/v1/article_emotional_conclusions?article_id=eq.${articleId}`, {
        method: 'DELETE', headers: { 'apikey': EXTERNAL_SUPABASE_ANON_KEY, 'Authorization': `Bearer ${session.data.session?.access_token || EXTERNAL_SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) { toast.error('Erro ao excluir conclusão'); return false; }
      setConclusion(null);
      toast.success('Conclusão excluída');
      return true;
    } catch (err) { return false; }
  }, [articleId]);

  return { conclusion, isLoading, isGenerating, fetchConclusion, generateConclusion, updateConclusion, deleteConclusion };
}
