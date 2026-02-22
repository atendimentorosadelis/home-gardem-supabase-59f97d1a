import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { invokeEdgeFunction } from '@/lib/edge-functions';
import { toast } from 'sonner';

interface TranslationCache {
  title: string;
  excerpt: string;
  content: string;
  language: string;
  cachedAt: number;
  expiresAt: number;
}

interface UseTranslatedContentOptions {
  title: string;
  excerpt?: string;
  content?: string;
  slug: string;
  enabled?: boolean;
}

interface UseTranslatedContentResult {
  translatedTitle: string;
  translatedExcerpt: string;
  translatedContent: string;
  isTranslating: boolean;
  isTranslated: boolean;
  error: string | null;
  showOriginal: boolean;
  toggleOriginal: () => void;
}

const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function getCacheKey(slug: string, lang: string, contentLength: number): string {
  return `translation_cache_${slug}_${lang}_${contentLength}`;
}

function getFromCache(slug: string, lang: string, contentLength: number): TranslationCache | null {
  try {
    const key = getCacheKey(slug, lang, contentLength);
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const data: TranslationCache = JSON.parse(cached);
    if (Date.now() > data.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function saveToCache(slug: string, lang: string, contentLength: number, title: string, excerpt: string, content: string): void {
  try {
    const key = getCacheKey(slug, lang, contentLength);
    const now = Date.now();
    const cache: TranslationCache = { title, excerpt, content, language: lang, cachedAt: now, expiresAt: now + CACHE_DURATION_MS };
    localStorage.setItem(key, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to save translation to cache:', error);
  }
}

export function useTranslatedContent({ title, excerpt = '', content = '', slug, enabled = true }: UseTranslatedContentOptions): UseTranslatedContentResult {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language;

  const [translatedTitle, setTranslatedTitle] = useState(title);
  const [translatedExcerpt, setTranslatedExcerpt] = useState(excerpt);
  const [translatedContent, setTranslatedContent] = useState(content);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  const toggleOriginal = useCallback(() => { setShowOriginal(prev => !prev); }, []);

  useEffect(() => {
    setTranslatedTitle(title);
    setTranslatedExcerpt(excerpt);
    setTranslatedContent(content);
    setIsTranslated(false);
    setError(null);
  }, [title, excerpt, content]);

  useEffect(() => {
    if (!enabled || showOriginal || currentLang === 'pt-BR' || currentLang === 'pt') {
      setTranslatedTitle(title);
      setTranslatedExcerpt(excerpt);
      setTranslatedContent(content);
      setIsTranslated(false);
      return;
    }

    const cached = getFromCache(slug, currentLang, content.length);
    if (cached) {
      setTranslatedTitle(cached.title);
      setTranslatedExcerpt(cached.excerpt);
      setTranslatedContent(cached.content);
      setIsTranslated(true);
      return;
    }

    const translateContent = async () => {
      setIsTranslating(true);
      setError(null);

      try {
        const { data, error: fnError } = await invokeEdgeFunction('translate-content', { title, excerpt, content, targetLanguage: currentLang });
        if (fnError) throw new Error(fnError.message);

        if (data.error) {
          if (data.fallback) {
            console.warn('Translation failed, using original content');
            setError(data.error);
          } else {
            throw new Error(data.error);
          }
        } else {
          setTranslatedTitle(data.title || title);
          setTranslatedExcerpt(data.excerpt || excerpt);
          setTranslatedContent(data.content || content);
          setIsTranslated(true);
          saveToCache(slug, currentLang, content.length, data.title || title, data.excerpt || excerpt, data.content || content);
        }
      } catch (err) {
        console.error('Translation error:', err);
        const message = err instanceof Error ? err.message : 'Translation failed';
        setError(message);
        if (message.includes('Rate limit') || message.includes('credits') || message.includes('402')) {
          toast.error(t('common.translationCreditsExhausted', 'AI translation credits exhausted. Showing original content.'));
        } else if (message.includes('429')) {
          toast.error(t('common.translationRateLimited', 'Too many translation requests. Please wait a moment.'));
        }
      } finally {
        setIsTranslating(false);
      }
    };

    translateContent();
  }, [slug, currentLang, title, excerpt, content, enabled, showOriginal, t]);

  if (showOriginal) {
    return { translatedTitle: title, translatedExcerpt: excerpt, translatedContent: content, isTranslating: false, isTranslated: false, error: null, showOriginal, toggleOriginal };
  }

  return { translatedTitle, translatedExcerpt, translatedContent, isTranslating, isTranslated, error, showOriginal, toggleOriginal };
}

export function useTranslatedPreview({ title, excerpt = '', slug, enabled = true }: Omit<UseTranslatedContentOptions, 'content'>): Pick<UseTranslatedContentResult, 'translatedTitle' | 'translatedExcerpt' | 'isTranslating' | 'isTranslated'> {
  const result = useTranslatedContent({ title, excerpt, content: '', slug, enabled });
  return { translatedTitle: result.translatedTitle, translatedExcerpt: result.translatedExcerpt, isTranslating: result.isTranslating, isTranslated: result.isTranslated };
}
