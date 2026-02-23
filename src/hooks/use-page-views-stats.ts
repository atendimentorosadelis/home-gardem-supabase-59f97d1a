import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function usePageViewsStats() {
  return useQuery({
    queryKey: ['page-views-stats'],
    queryFn: async () => {
      const now = new Date();
      const startCurrent = startOfMonth(now);
      const startLast = startOfMonth(subMonths(now, 1));

      const { count: totalPageViews } = await (supabase as any)
        .from('page_views').select('*', { count: 'exact', head: true });

      const { count: pageViewsThisMonth } = await (supabase as any)
        .from('page_views').select('*', { count: 'exact', head: true })
        .gte('viewed_at', startCurrent.toISOString());

      const { count: pageViewsLastMonth } = await (supabase as any)
        .from('page_views').select('*', { count: 'exact', head: true })
        .gte('viewed_at', startLast.toISOString())
        .lt('viewed_at', startCurrent.toISOString());

      const { count: pageViewsToday } = await (supabase as any)
        .from('page_views').select('*', { count: 'exact', head: true })
        .gte('viewed_at', new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString());

      // Unique visitors (by viewer_hash)
      const { data: uniqueData } = await (supabase as any)
        .from('page_views').select('viewer_hash');
      const uniqueVisitors = new Set((uniqueData || []).map((v: any) => v.viewer_hash)).size;

      return {
        totalPageViews: totalPageViews || 0,
        pageViewsThisMonth: pageViewsThisMonth || 0,
        pageViewsLastMonth: pageViewsLastMonth || 0,
        pageViewsToday: pageViewsToday || 0,
        uniqueVisitors,
      };
    },
  });
}

export function usePageViewsChart(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['page-views-chart', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('page_views').select('viewed_at')
        .gte('viewed_at', startDate.toISOString())
        .lte('viewed_at', endDate.toISOString())
        .order('viewed_at', { ascending: true });

      if (error) throw error;

      const viewsByDate = new Map<string, number>();
      const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      for (let i = 0; i < diffDays; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
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

export function useTopPages(limit = 10) {
  return useQuery({
    queryKey: ['top-pages', limit],
    queryFn: async () => {
      const { data } = await (supabase as any).from('page_views').select('page_path');
      const counts: Record<string, number> = {};
      (data || []).forEach((v: any) => {
        counts[v.page_path] = (counts[v.page_path] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([path, views]) => ({ path, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, limit);
    },
  });
}
