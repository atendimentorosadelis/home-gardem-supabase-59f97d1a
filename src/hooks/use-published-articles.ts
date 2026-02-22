import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Post } from '@/components/home/PostCard';
import { formatDateShort } from '@/utils/formatDate';

interface DatabaseArticle {
  id: string;
  title: string;
  body: string | null;
  excerpt: string | null;
  category: string | null;
  category_slug: string | null;
  slug: string | null;
  cover_image: string | null;
  gallery_images: string[] | null;
  tags: string[] | null;
  read_time: string | null;
  published_at: string | null;
  created_at: string | null;
  likes_count: number | null;
}

function mapArticleToPost(article: DatabaseArticle): Post {
  return {
    id: article.slug || article.id,
    uuid: article.id,
    title: article.title,
    excerpt: article.excerpt || '',
    category: article.category || 'Decoração',
    categorySlug: article.category_slug || 'decoracao',
    image: article.cover_image || '/placeholder.svg',
    date: formatDateShort(article.published_at || article.created_at),
    readTime: article.read_time || '5 min',
    content: article.body || undefined,
    tags: article.tags || undefined,
    likesCount: article.likes_count || 0,
  };
}

export function usePublishedArticles() {
  return useQuery({
    queryKey: ['published-articles'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('content_articles')
        .select('*')
        .eq('status', 'published')
        .not('published_at', 'is', null)
        .not('cover_image', 'is', null)
        .order('published_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching articles:', error);
        return [];
      }

      return (data || []).map(mapArticleToPost);
    },
  });
}
