import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useArticleViewCount(articleId: string | undefined) {
  return useQuery({
    queryKey: ['article-views', articleId],
    queryFn: async () => {
      if (!articleId) return 0;

      const { data: article } = await supabase
        .from('content_articles')
        .select('id')
        .eq('slug', articleId)
        .maybeSingle();

      if (!article) return 0;

      const { count, error } = await supabase
        .from('article_views')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', article.id);

      if (error) {
        console.error('Error fetching view count:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!articleId,
  });
}
