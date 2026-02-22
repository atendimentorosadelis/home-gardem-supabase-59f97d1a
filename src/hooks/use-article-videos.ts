import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { invokeEdgeFunction, EDGE_FUNCTIONS } from '@/lib/edge-functions';
import { toast } from 'sonner';

export interface ArticleVideo { id: string; article_id: string; youtube_video_id: string; youtube_url: string; video_title: string | null; is_enabled: boolean; created_at: string; updated_at: string; }
export interface ArticleWithVideo { id: string; title: string; slug: string; category_slug: string; status: string; published_at: string | null; video: ArticleVideo | null; }
export interface VideoSettings { enabled: boolean; daily_limit: number; }

export function useArticleVideos() {
  const [videos, setVideos] = useState<ArticleVideo[]>([]);
  const [articlesWithVideos, setArticlesWithVideos] = useState<ArticleWithVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState<VideoSettings>({ enabled: false, daily_limit: 10 });

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: videosData, error: videosError } = await (supabase as any).from('article_videos').select('*').order('created_at', { ascending: false });
      if (videosError) { setVideos([]); } else { setVideos((videosData as ArticleVideo[]) || []); }
      const { data: articlesData, error: articlesError } = await (supabase as any).from('content_articles').select('id, title, slug, category_slug, status, published_at').eq('status', 'published').order('published_at', { ascending: false });
      if (articlesError) throw articlesError;
      const videoMap = new Map((videosData as ArticleVideo[] || []).map((v: ArticleVideo) => [v.article_id, v]));
      const mapped: ArticleWithVideo[] = (articlesData || []).map((article: any) => ({
        id: article.id, title: article.title, slug: article.slug || '', category_slug: article.category_slug || '', status: article.status || 'published', published_at: article.published_at, video: videoMap.get(article.id) || null,
      }));
      setArticlesWithVideos(mapped);
    } catch (error) { console.error('Error fetching videos:', error); toast.error('Erro ao carregar vídeos'); } finally { setIsLoading(false); }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any).from('site_settings').select('value').eq('key', 'video_auto_generation').maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      if (data?.value) { const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value; setSettings(parsed); }
    } catch (error) { console.error('Error fetching video settings:', error); }
  }, []);

  const toggleGlobalEnabled = async (enabled: boolean) => {
    try {
      const newSettings = { ...settings, enabled };
      const { error } = await (supabase as any).from('site_settings').upsert({ key: 'video_auto_generation', value: newSettings, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw error;
      setSettings(newSettings);
      toast.success(enabled ? 'Geração automática ativada' : 'Geração automática desativada');
    } catch (error) { toast.error('Erro ao alterar configuração'); }
  };

  const toggleVideoEnabled = async (articleId: string, enabled: boolean) => {
    try {
      const { error } = await (supabase as any).from('article_videos').update({ is_enabled: enabled, updated_at: new Date().toISOString() }).eq('article_id', articleId);
      if (error) throw error;
      setVideos(prev => prev.map(v => v.article_id === articleId ? { ...v, is_enabled: enabled } : v));
      setArticlesWithVideos(prev => prev.map(a => a.id === articleId && a.video ? { ...a, video: { ...a.video, is_enabled: enabled } } : a));
      toast.success(enabled ? 'Vídeo ativado' : 'Vídeo desativado');
    } catch (error) { toast.error('Erro ao alterar visibilidade'); }
  };

  const regenerateVideo = async (articleId: string) => {
    setIsProcessing(true);
    try {
      const { data, error } = await invokeEdgeFunction(EDGE_FUNCTIONS.SEARCH_YOUTUBE_VIDEO, { articleId, saveToDb: true });
      if (error) throw error;
      if (data?.success) { toast.success(`Vídeo encontrado: ${data.videoTitle}`); await fetchVideos(); }
      else throw new Error(data?.error || 'Falha ao buscar vídeo');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Erro ao regenerar vídeo'); } finally { setIsProcessing(false); }
  };

  const deleteVideo = async (articleId: string) => {
    try {
      const { error } = await (supabase as any).from('article_videos').delete().eq('article_id', articleId);
      if (error) throw error;
      setVideos(prev => prev.filter(v => v.article_id !== articleId));
      setArticlesWithVideos(prev => prev.map(a => a.id === articleId ? { ...a, video: null } : a));
      toast.success('Vídeo removido');
    } catch (error) { toast.error('Erro ao remover vídeo'); }
  };

  const processQueue = async (batchSize: number = 5) => {
    setIsProcessing(true);
    try {
      const { data, error } = await invokeEdgeFunction(EDGE_FUNCTIONS.PROCESS_VIDEO_QUEUE, { batchSize, force: true });
      if (error) throw error;
      if (data?.success) { toast.success(`Processados: ${data.successful}/${data.processed} artigos`); await fetchVideos(); }
    } catch (error) { toast.error('Erro ao processar fila'); } finally { setIsProcessing(false); }
  };

  const getVideoForArticle = async (articleId: string): Promise<ArticleVideo | null> => {
    try {
      const { data, error } = await (supabase as any).from('article_videos').select('*').eq('article_id', articleId).eq('is_enabled', true).maybeSingle();
      if (error) throw error;
      return data as ArticleVideo | null;
    } catch (error) { return null; }
  };

  const updateDailyLimit = async (limit: number) => {
    try {
      const newSettings = { ...settings, daily_limit: limit };
      const { error } = await (supabase as any).from('site_settings').upsert({ key: 'video_auto_generation', value: newSettings, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw error;
      setSettings(newSettings); toast.success('Limite diário atualizado');
    } catch (error) { toast.error('Erro ao atualizar limite'); }
  };

  const getStats = useCallback(() => {
    const withVideo = articlesWithVideos.filter(a => a.video !== null).length;
    const withoutVideo = articlesWithVideos.filter(a => a.video === null).length;
    return { total: articlesWithVideos.length, withVideo, withoutVideo, enabledVideos: videos.filter(v => v.is_enabled).length, disabledVideos: videos.filter(v => !v.is_enabled).length };
  }, [articlesWithVideos, videos]);

  useEffect(() => { fetchVideos(); fetchSettings(); }, [fetchVideos, fetchSettings]);

  return { videos, articlesWithVideos, settings, isLoading, isProcessing, fetchVideos, toggleGlobalEnabled, updateDailyLimit, toggleVideoEnabled, regenerateVideo, deleteVideo, processQueue, getVideoForArticle, getStats };
}

export function useArticleVideo(articleId: string | undefined) {
  const [video, setVideo] = useState<ArticleVideo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!articleId) { setIsLoading(false); return; }
    const fetchVideo = async () => {
      try { const { data, error } = await (supabase as any).from('article_videos').select('*').eq('article_id', articleId).eq('is_enabled', true).maybeSingle(); if (error && error.code !== 'PGRST116') throw error; setVideo(data as ArticleVideo | null); }
      catch (error) { console.error('Error fetching article video:', error); } finally { setIsLoading(false); }
    };
    fetchVideo();
  }, [articleId]);
  return { video, isLoading };
}
