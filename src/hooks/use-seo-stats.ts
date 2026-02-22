import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useSEOStats() {
  return useQuery({
    queryKey: ['seo-stats'],
    queryFn: async () => {
      const { data: articles, error } = await (supabase as any).from('content_articles').select('id, title, slug, keywords, excerpt, cover_image, body, published_at').eq('status', 'published').order('published_at', { ascending: false });
      if (error) throw error;
      if (!articles || articles.length === 0) return { overallScore: 0, totalArticles: 0, criteriaPercentages: { keywords: 0, excerpt: 0, coverImage: 0, content: 0 }, topKeywords: [], articlesSEO: [] };

      const { data: viewsData } = await (supabase as any).from('article_views').select('article_id');
      const vc: Record<string, number> = {};
      (viewsData || []).forEach((v: any) => { vc[v.article_id] = (vc[v.article_id] || 0) + 1; });

      const articlesSEO = articles.map((a: any) => {
        let score = 0;
        const hasKeywords = !!(a.keywords && a.keywords.trim().length > 0);
        const hasExcerpt = !!(a.excerpt && a.excerpt.trim().length > 0);
        const hasOptimalExcerpt = !!(a.excerpt && a.excerpt.length >= 120 && a.excerpt.length <= 160);
        const hasCoverImage = !!(a.cover_image && a.cover_image.trim().length > 0);
        const hasOptimalContent = !!(a.body && a.body.length >= 3000);
        if (hasKeywords) score += 25;
        if (hasOptimalExcerpt) score += 25; else if (hasExcerpt) score += 15;
        if (hasCoverImage) score += 25;
        if (hasOptimalContent) score += 25;
        return { id: a.id, title: a.title, slug: a.slug, score, criteria: { hasKeywords, hasExcerpt, hasOptimalExcerpt, hasCoverImage, hasOptimalContent }, views: vc[a.id] || 0, published_at: a.published_at };
      });

      const overallScore = Math.round(articlesSEO.reduce((s: number, a: any) => s + a.score, 0) / articles.length);
      const criteriaPercentages = {
        keywords: Math.round((articlesSEO.filter((a: any) => a.criteria.hasKeywords).length / articles.length) * 100),
        excerpt: Math.round((articlesSEO.filter((a: any) => a.criteria.hasOptimalExcerpt).length / articles.length) * 100),
        coverImage: Math.round((articlesSEO.filter((a: any) => a.criteria.hasCoverImage).length / articles.length) * 100),
        content: Math.round((articlesSEO.filter((a: any) => a.criteria.hasOptimalContent).length / articles.length) * 100),
      };

      const kwCounts: Record<string, number> = {};
      articles.forEach((a: any) => { (a.keywords || '').split(',').map((k: string) => k.trim().toLowerCase()).filter((k: string) => k.length > 0).forEach((k: string) => { kwCounts[k] = (kwCounts[k] || 0) + 1; }); });
      const topKeywords = Object.entries(kwCounts).map(([keyword, count]) => ({ keyword, count })).sort((a, b) => b.count - a.count).slice(0, 15);

      return { overallScore, totalArticles: articles.length, criteriaPercentages, topKeywords, articlesSEO: articlesSEO.sort((a: any, b: any) => b.score - a.score) };
    },
  });
}
