import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface GenerationHistoryItem {
  id: string;
  topic: string;
  article_title: string | null;
  article_id: string | null;
  status: string;
  created_at: string;
}

export function useGenerationHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any).from('generation_history').select('*').order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching generation history:', error);
    } finally { setIsLoading(false); }
  }, [user]);

  const addToHistory = useCallback(async (topic: string, articleTitle: string | null, articleId: string | null, status: 'success' | 'error') => {
    if (!user) return;
    try {
      const { error } = await (supabase as any).from('generation_history').insert({ user_id: user.id, topic, article_title: articleTitle, article_id: articleId, status });
      if (error) throw error;
      await fetchHistory();
    } catch (error) { console.error('Error adding to history:', error); }
  }, [user, fetchHistory]);

  const deleteFromHistory = useCallback(async (id: string) => {
    try {
      const { error } = await (supabase as any).from('generation_history').delete().eq('id', id);
      if (error) throw error;
      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success('Item removido do histórico');
    } catch { toast.error('Erro ao remover item'); }
  }, []);

  const updateHistoryArticleId = useCallback(async (topic: string, articleId: string) => {
    if (!user) return;
    try {
      const { data: entries } = await (supabase as any).from('generation_history').select('id').eq('user_id', user.id).eq('topic', topic).is('article_id', null).order('created_at', { ascending: false }).limit(1);
      if (entries && entries.length > 0) {
        await (supabase as any).from('generation_history').update({ article_id: articleId }).eq('id', entries[0].id);
        await fetchHistory();
      }
    } catch (error) { console.error('Error updating history:', error); }
  }, [user, fetchHistory]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  return { history, isLoading, addToHistory, deleteFromHistory, updateHistoryArticleId, refetchHistory: fetchHistory };
}
