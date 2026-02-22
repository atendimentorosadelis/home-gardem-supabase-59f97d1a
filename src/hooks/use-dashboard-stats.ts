import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { startOfMonth, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardStats { totalArticles: number; totalViews: number; articlesThisMonth: number; viewsThisMonth: number; articlesLastMonth: number; viewsLastMonth: number; engagement: number; }
interface RecentArticle { id: string; title: string; category: string | null; published_at: string | null; status: string | null; }
interface Activity { id: string; type: 'created' | 'published'; title: string; date: string; }

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();
      const startCurrent = startOfMonth(now);
      const startLast = startOfMonth(subMonths(now, 1));
      const { count: totalArticles } = await (supabase as any).from('content_articles').select('*', { count: 'exact', head: true }).eq('status', 'published');
      const { count: articlesThisMonth } = await (supabase as any).from('content_articles').select('*', { count: 'exact', head: true }).eq('status', 'published').gte('published_at', startCurrent.toISOString());
      const { count: articlesLastMonth } = await (supabase as any).from('content_articles').select('*', { count: 'exact', head: true }).eq('status', 'published').gte('published_at', startLast.toISOString()).lt('published_at', startCurrent.toISOString());
      const { count: totalViews } = await (supabase as any).from('article_views').select('*', { count: 'exact', head: true });
      const { count: viewsThisMonth } = await (supabase as any).from('article_views').select('*', { count: 'exact', head: true }).gte('viewed_at', startCurrent.toISOString());
      const { count: viewsLastMonth } = await (supabase as any).from('article_views').select('*', { count: 'exact', head: true }).gte('viewed_at', startLast.toISOString()).lt('viewed_at', startCurrent.toISOString());
      const engagement = totalArticles && totalArticles > 0 ? Math.round((totalViews || 0) / totalArticles) : 0;
      return { totalArticles: totalArticles || 0, totalViews: totalViews || 0, articlesThisMonth: articlesThisMonth || 0, viewsThisMonth: viewsThisMonth || 0, articlesLastMonth: articlesLastMonth || 0, viewsLastMonth: viewsLastMonth || 0, engagement };
    },
  });
}

export function useRecentArticles(limit = 5) {
  return useQuery({
    queryKey: ['recent-articles', limit],
    queryFn: async (): Promise<RecentArticle[]> => {
      const { data, error } = await (supabase as any).from('content_articles').select('id, title, category, published_at, status').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useRecentActivity(limit = 5) {
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: async (): Promise<Activity[]> => {
      const { data, error } = await (supabase as any).from('content_articles').select('id, title, created_at, published_at, status').order('updated_at', { ascending: false }).limit(limit);
      if (error) throw error;
      const activities: Activity[] = [];
      (data || []).forEach((article: any) => {
        if (article.published_at) activities.push({ id: `${article.id}-published`, type: 'published', title: article.title, date: article.published_at });
        activities.push({ id: `${article.id}-created`, type: 'created', title: article.title, date: article.created_at });
      });
      return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
    },
  });
}

export function calculateChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const change = Math.round(((current - previous) / previous) * 100);
  return change >= 0 ? `+${change}%` : `${change}%`;
}

export interface ViewsByDate { date: string; views: number; }

export function useViewsChart(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['views-chart', startDate.toISOString(), endDate.toISOString()],
    queryFn: async (): Promise<ViewsByDate[]> => {
      const { data, error } = await (supabase as any).from('article_views').select('viewed_at').gte('viewed_at', startDate.toISOString()).lte('viewed_at', endDate.toISOString()).order('viewed_at', { ascending: true });
      if (error) throw error;
      const viewsByDate = new Map<string, number>();
      const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      for (let i = 0; i < diffDays; i++) {
        const date = new Date(startDate); date.setDate(startDate.getDate() + i);
        viewsByDate.set(format(date, 'dd/MM', { locale: ptBR }), 0);
      }
      (data || []).forEach((view: any) => {
        const key = format(new Date(view.viewed_at), 'dd/MM', { locale: ptBR });
        if (viewsByDate.has(key)) viewsByDate.set(key, (viewsByDate.get(key) || 0) + 1);
      });
      return Array.from(viewsByDate.entries()).map(([date, views]) => ({ date, views }));
    },
  });
}
