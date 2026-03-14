import { useState, useEffect } from 'react';
import { invokeEdgeFunction } from '@/lib/edge-functions';
import { supabase } from '@/lib/supabase';

interface UseArticleImagesProps {
  postId: string;
  title: string;
  category: string;
  tags: string[];
  count?: number;
}

interface GeneratedImage {
  url: string;
  prompt: string;
}

interface ArticleContextForImages {
  title: string | null;
  slug: string | null;
  category_slug: string | null;
  tags: string[] | null;
  main_subject: string | null;
  visual_context: string | null;
  gallery_prompts: string[] | null;
  excerpt: string | null;
  body: string | null;
}

const CACHE_KEY_PREFIX = 'article_images_';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export function useArticleImages({ postId, title, category, tags, count = 6 }: UseArticleImagesProps) {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!title || !postId) {
      setIsLoading(false);
      return;
    }

    const fetchImages = async () => {
      setIsLoading(true);
      setError(null);

      const cacheKey = `${CACHE_KEY_PREFIX}${postId}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          const { images: cachedImages, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setImages(cachedImages);
            setIsLoading(false);
            return;
          }
        } catch {
          localStorage.removeItem(cacheKey);
        }
      }

      const generatedImages: GeneratedImage[] = [];

      try {
        const { data } = await supabase
          .from('content_articles')
          .select('title, slug, category_slug, tags, main_subject, visual_context, gallery_prompts, excerpt, body')
          .eq('id', postId)
          .maybeSingle();

        const articleContext = data as ArticleContextForImages | null;

        for (let i = 0; i < count; i++) {
          try {
            const { data, error: fnError } = await invokeEdgeFunction('generate-article-image', {
              articleId: postId,
              title: articleContext?.title || title,
              slug: articleContext?.slug || undefined,
              category: articleContext?.category_slug || category,
              tags: articleContext?.tags || tags,
              type: 'gallery',
              regenerate: true,
              imageIndex: i,
              customPrompt: articleContext?.gallery_prompts?.[i] || undefined,
              mainSubject: articleContext?.main_subject || undefined,
              visualContext: articleContext?.visual_context || undefined,
              articleExcerpt: articleContext?.excerpt || undefined,
              articleBody: articleContext?.body || undefined,
            });

            if (fnError) continue;

            if (data?.success && data?.imageUrl) {
              generatedImages.push({ url: data.imageUrl, prompt: data.prompt });
            }
          } catch (err) {
            console.error('Error generating image:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching article context for images:', err);
      }

      if (generatedImages.length > 0) {
        localStorage.setItem(cacheKey, JSON.stringify({ images: generatedImages, timestamp: Date.now() }));
        setImages(generatedImages);
      } else {
        setError('Não foi possível gerar as imagens');
      }

      setIsLoading(false);
    };

    fetchImages();
  }, [postId, title, category, count, refreshKey, tags]);

  const regenerate = () => {
    const cacheKey = `${CACHE_KEY_PREFIX}${postId}`;
    localStorage.removeItem(cacheKey);
    setImages([]);
    setRefreshKey(prev => prev + 1);
  };

  return { images, isLoading, error, regenerate };
}
