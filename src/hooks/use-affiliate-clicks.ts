import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface AffiliateClickStats {
  totalClicks: number;
  uniqueClicks: number;
  clicksByDay: { date: string; clicks: number }[];
}

export function useRegisterAffiliateClick() {
  return useMutation({
    mutationFn: async (articleId: string) => {
      const sessionHash = btoa(navigator.userAgent + new Date().toDateString());
      const { data, error } = await (supabase as any).rpc('register_affiliate_click', {
        p_article_id: articleId,
        p_ip_hash: sessionHash,
        p_user_agent: navigator.userAgent,
        p_referrer: document.referrer || null,
      });
      if (error) throw error;
      return data as number;
    },
  });
}

export function useAffiliateClickStats(articleId: string | undefined, days: number = 30) {
  return useQuery({
    queryKey: ['affiliate-clicks', articleId, days],
    queryFn: async (): Promise<AffiliateClickStats> => {
      if (!articleId) return { totalClicks: 0, uniqueClicks: 0, clicksByDay: [] };
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const { data: clicks, error } = await (supabase as any)
        .from('affiliate_banner_clicks')
        .select('*')
        .eq('article_id', articleId)
        .gte('clicked_at', startDate.toISOString())
        .order('clicked_at', { ascending: false });
      if (error) throw error;
      const totalClicks = clicks?.length || 0;
      const uniqueIps = new Set(clicks?.map((c: any) => c.ip_hash) || []);
      const uniqueClicks = uniqueIps.size;
      const clicksByDayMap = new Map<string, number>();
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        clicksByDayMap.set(date.toISOString().split('T')[0], 0);
      }
      clicks?.forEach((click: any) => {
        const dateStr = new Date(click.clicked_at).toISOString().split('T')[0];
        clicksByDayMap.set(dateStr, (clicksByDayMap.get(dateStr) || 0) + 1);
      });
      const clicksByDay = Array.from(clicksByDayMap.entries()).map(([date, clicks]) => ({ date, clicks }));
      return { totalClicks, uniqueClicks, clicksByDay };
    },
    enabled: !!articleId,
  });
}

export function useAllAffiliateStats(days: number = 30) {
  return useQuery({
    queryKey: ['all-affiliate-stats', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const { data: articles, error: articlesError } = await (supabase as any)
        .from('content_articles')
        .select('id, title, slug, affiliate_clicks_count, affiliate_banner_enabled')
        .eq('affiliate_banner_enabled', true)
        .order('affiliate_clicks_count', { ascending: false });
      if (articlesError) throw articlesError;
      const { data: recentClicks, error: clicksError } = await (supabase as any)
        .from('affiliate_banner_clicks')
        .select('article_id, clicked_at')
        .gte('clicked_at', startDate.toISOString());
      if (clicksError) throw clicksError;
      const stats = articles?.map((article: any) => {
        const articleClicks = recentClicks?.filter((c: any) => c.article_id === article.id) || [];
        return { ...article, recentClicks: articleClicks.length };
      }) || [];
      return { articles: stats, totalRecentClicks: recentClicks?.length || 0, totalArticlesWithBanner: articles?.length || 0 };
    },
  });
}
