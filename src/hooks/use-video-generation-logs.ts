import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface VideoGenerationLog {
  id: string;
  article_id: string | null;
  article_title: string | null;
  status: 'success' | 'error' | 'pending';
  video_id: string | null;
  error_message: string | null;
  duration_ms: number | null;
  executed_at: string;
}

export function useVideoGenerationLogs(limit: number = 20) {
  const [logs, setLogs] = useState<VideoGenerationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { count } = await (supabase as any)
        .from('video_generation_logs')
        .select('*', { count: 'exact', head: true });

      setTotalCount(count || 0);

      const { data, error } = await (supabase as any)
        .from('video_generation_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching video logs:', error);
        setLogs([]);
      } else {
        setLogs((data as unknown as VideoGenerationLog[]) || []);
      }
    } catch (error) {
      console.error('Error fetching video logs:', error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit, page]);

  const clearLogs = async () => {
    try {
      const { error } = await (supabase as any)
        .from('video_generation_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      setLogs([]);
      setTotalCount(0);
      return true;
    } catch (error) {
      console.error('Error clearing logs:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    isLoading,
    totalCount,
    page,
    setPage,
    totalPages: Math.ceil(totalCount / limit),
    refetch: fetchLogs,
    clearLogs,
  };
}
