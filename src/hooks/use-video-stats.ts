import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface VideoStats { totalVideos: number; enabledVideos: number; disabledVideos: number; articlesWithVideo: number; articlesWithoutVideo: number; videosAddedToday: number; videosAddedThisWeek: number; videosAddedThisMonth: number; coveragePercentage: number; }

export function useVideoStats() {
  return useQuery({
    queryKey: ['video-stats'],
    queryFn: async (): Promise<VideoStats> => {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: videos, error: videosError } = await (supabase as any).from('article_videos').select('id, article_id, is_enabled, created_at');
      if (videosError && videosError.code !== 'PGRST116') console.error('Error:', videosError);

      const { count: totalArticles } = await (supabase as any).from('content_articles').select('id', { count: 'exact', head: true }).eq('status', 'published');

      const vl = (videos as any[]) || [];
      const totalVideos = vl.length;
      const totalArticlesCount = totalArticles || 0;
      return {
        totalVideos, enabledVideos: vl.filter(v => v.is_enabled).length, disabledVideos: vl.filter(v => !v.is_enabled).length,
        articlesWithVideo: totalVideos, articlesWithoutVideo: Math.max(0, totalArticlesCount - totalVideos),
        videosAddedToday: vl.filter(v => new Date(v.created_at) >= new Date(startOfToday)).length,
        videosAddedThisWeek: vl.filter(v => new Date(v.created_at) >= new Date(startOfWeek)).length,
        videosAddedThisMonth: vl.filter(v => new Date(v.created_at) >= new Date(startOfMonth)).length,
        coveragePercentage: totalArticlesCount > 0 ? Math.round((totalVideos / totalArticlesCount) * 100) : 0,
      };
    },
    staleTime: 30000,
  });
}
