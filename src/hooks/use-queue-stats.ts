import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DailyStats { date: string; dateFormatted: string; total: number; cover: number; gallery: number; }
export interface QueueStats { total: number; cover: number; gallery: number; webp: number; other: number; successRate: number; avgSizeKb: number; avgSizeFormatted: string; todayTotal: number; todayCover: number; todayGallery: number; recentItems: ImageItemSummary[]; dailyHistory: DailyStats[]; }
export interface ImageItemSummary { id: string; article_id: string; article_title: string; image_type: 'cover' | 'gallery'; format: string; file_size: number | null; public_url: string; created_at: string; }

export function useQueueStats(days: number = 7) {
  return useQuery({
    queryKey: ['image-stats', days],
    queryFn: async (): Promise<QueueStats> => {
      const startDate = subDays(new Date(), days);
      const { data: items, error } = await (supabase as any).from('article_images').select('*').gte('created_at', startDate.toISOString()).order('created_at', { ascending: false });
      if (error) throw error;
      const images = items || [];
      const total = images.length;
      const cover = images.filter((i: any) => i.image_type === 'cover').length;
      const gallery = images.filter((i: any) => i.image_type === 'gallery').length;
      const webp = images.filter((i: any) => i.format === 'webp').length;
      const other = images.filter((i: any) => i.format !== 'webp').length;
      const successRate = total > 0 ? 100 : 0;
      const imagesWithSize = images.filter((i: any) => i.file_size && i.file_size > 0);
      let avgSizeKb = 0;
      if (imagesWithSize.length > 0) { avgSizeKb = imagesWithSize.reduce((sum: number, item: any) => sum + (item.file_size || 0), 0) / imagesWithSize.length / 1024; }
      let avgSizeFormatted = '0 KB';
      if (avgSizeKb > 0) { avgSizeFormatted = avgSizeKb >= 1024 ? `${(avgSizeKb / 1024).toFixed(1)} MB` : `${avgSizeKb.toFixed(0)} KB`; }
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayItems = images.filter((i: any) => new Date(i.created_at) >= today);
      const dailyHistory: DailyStats[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date); const dayEnd = endOfDay(date);
        const dayItems = images.filter((item: any) => { const d = new Date(item.created_at); return d >= dayStart && d <= dayEnd; });
        dailyHistory.push({ date: format(date, 'yyyy-MM-dd'), dateFormatted: format(date, 'EEE', { locale: ptBR }), total: dayItems.length, cover: dayItems.filter((i: any) => i.image_type === 'cover').length, gallery: dayItems.filter((i: any) => i.image_type === 'gallery').length });
      }
      const recentItems = images.slice(0, 20);
      const articleIds = [...new Set(recentItems.map((i: any) => i.article_id))];
      const { data: articles } = await (supabase as any).from('content_articles').select('id, title').in('id', articleIds);
      const articleMap = new Map((articles || []).map((a: any) => [a.id, a.title]));
      const recentItemsWithTitles: ImageItemSummary[] = recentItems.map((item: any) => ({
        id: item.id, article_id: item.article_id, article_title: articleMap.get(item.article_id) || 'Artigo desconhecido',
        image_type: item.image_type, format: item.format || 'unknown', file_size: item.file_size, public_url: item.public_url, created_at: item.created_at,
      }));
      return { total, cover, gallery, webp, other, successRate, avgSizeKb, avgSizeFormatted, todayTotal: todayItems.length, todayCover: todayItems.filter((i: any) => i.image_type === 'cover').length, todayGallery: todayItems.filter((i: any) => i.image_type === 'gallery').length, recentItems: recentItemsWithTitles, dailyHistory };
    },
    refetchInterval: 10000,
  });
}
