import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function usePublishedArticles() {
  return useQuery({
    queryKey: ['published-articles'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('articles')
        .select('id, title, excerpt, image_url, category, slug, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching articles:', error);
        return [];
      }
      return data || [];
    },
  });
}
