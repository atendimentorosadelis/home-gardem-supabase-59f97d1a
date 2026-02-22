import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { invokeEdgeFunction } from '@/lib/edge-functions';
import { useToast } from '@/hooks/use-toast';

export interface GeneratedArticle {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  categorySlug: string;
  content: string;
  tags: string[];
  keywords: string;
  readTime: string;
  externalLinks: Array<{ text: string; url: string }>;
  mainSubject: string;
  visualContext: string;
  galleryPrompts: string[];
  coverImage?: string;
  galleryImages: string[];
}

export interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'done' | 'error' | 'cancelled';
  detail?: string;
}

const STORAGE_KEY = 'lovable_generated_article_state';

interface PersistedState {
  article: GeneratedArticle | null;
  articleSavedId: string | null;
  steps: GenerationStep[];
  startTime: number | null;
  isGenerating?: boolean;
  topic?: string;
}

function loadPersistedState(): PersistedState | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return null;
}

function savePersistedState(state: PersistedState) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function clearPersistedStateFn() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

const DEFAULT_STEPS: GenerationStep[] = [
  { id: 'metadata', label: 'Gerando metadados e conteúdo', status: 'pending' },
  { id: 'saving', label: 'Salvando rascunho', status: 'pending' },
  { id: 'conclusion', label: 'Gerando conclusão emocional', status: 'pending' },
  { id: 'cover', label: 'Criando imagem de capa', status: 'pending' },
  { id: 'gallery', label: 'Gerando galeria de imagens', status: 'pending', detail: '0/6' },
];

export function useFullArticleGeneration() {
  const persistedState = loadPersistedState();
  const hasLoadingSteps = persistedState?.steps?.some(s => s.status === 'loading') ?? false;

  const [isGenerating, setIsGenerating] = useState(persistedState?.isGenerating ?? hasLoadingSteps);
  const [article, setArticle] = useState<GeneratedArticle | null>(persistedState?.article ?? null);
  const [startTime, setStartTime] = useState<number | null>(persistedState?.startTime ?? null);
  const [articleSavedId, setArticleSavedId] = useState<string | null>(persistedState?.articleSavedId ?? null);
  const [steps, setSteps] = useState<GenerationStep[]>(persistedState?.steps ?? DEFAULT_STEPS);
  const [currentTopic, setCurrentTopic] = useState<string>(persistedState?.topic ?? '');

  const cancelledRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    const hasProgress = steps.some(s => s.status !== 'pending');
    if (article || isGenerating || hasProgress) {
      savePersistedState({ article, articleSavedId, steps, startTime, isGenerating, topic: currentTopic });
    }
  }, [article, articleSavedId, steps, startTime, isGenerating, currentTopic]);

  const updateStep = useCallback((id: string, updates: Partial<GenerationStep>) => {
    setSteps(prev => prev.map(step => step.id === id ? { ...step, ...updates } : step));
  }, []);

  const resetGeneration = useCallback(() => {
    setArticle(null);
    setStartTime(null);
    setArticleSavedId(null);
    setCurrentTopic('');
    cancelledRef.current = false;
    setSteps(DEFAULT_STEPS);
    clearPersistedStateFn();
  }, []);

  const cancelGeneration = useCallback(() => {
    cancelledRef.current = true;
    setIsGenerating(false);
    setSteps(prev => prev.map(step =>
      step.status === 'loading' || step.status === 'pending' ? { ...step, status: 'cancelled' } : step
    ));
    toast({ title: 'Geração cancelada', description: 'A geração do artigo foi interrompida.' });
  }, [toast]);

  const generateArticle = useCallback(async (topic: string): Promise<GeneratedArticle | null> => {
    if (!topic.trim()) {
      toast({ title: 'Tema obrigatório', description: 'Por favor, informe um tema para o artigo.', variant: 'destructive' });
      return null;
    }

    setIsGenerating(true);
    setCurrentTopic(topic);
    resetGeneration();
    setCurrentTopic(topic);
    setStartTime(Date.now());

    try {
      // Step 1: Generate content
      updateStep('metadata', { status: 'loading' });

      let generatedArticle: GeneratedArticle;

      try {
        const { data: articleData, error: articleError } = await invokeEdgeFunction('generate-full-article', { topic });
        if (articleError || !articleData?.success) throw new Error(articleData?.error || articleError?.message || 'Failed');

        generatedArticle = {
          ...articleData.article,
          mainSubject: articleData.article.mainSubject || '',
          visualContext: articleData.article.visualContext || '',
          galleryPrompts: articleData.article.galleryPrompts || [],
          coverImage: undefined,
          galleryImages: [],
        };
      } catch {
        // Fallback: create basic article
        const slug = topic.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
        generatedArticle = {
          title: topic,
          slug: `${slug}-${Date.now()}`,
          excerpt: `Artigo sobre ${topic}`,
          category: 'Decoração',
          categorySlug: 'decoracao',
          content: `<h2>${topic}</h2><p>Conteúdo sobre ${topic}. Edite este artigo para adicionar o conteúdo completo.</p>`,
          tags: [],
          keywords: topic.toLowerCase(),
          readTime: '5 min',
          externalLinks: [],
          mainSubject: topic,
          visualContext: '',
          galleryPrompts: [],
          coverImage: undefined,
          galleryImages: [],
        };
      }

      setArticle(generatedArticle);
      updateStep('metadata', { status: 'done' });

      if (cancelledRef.current) return generatedArticle;

      // Step 2: Save to database
      updateStep('saving', { status: 'loading' });

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: saved } = await (supabase as any).from('content_articles').insert({
            author_id: user.id,
            title: generatedArticle.title,
            body: generatedArticle.content,
            excerpt: generatedArticle.excerpt,
            category: generatedArticle.category,
            category_slug: generatedArticle.categorySlug,
            slug: generatedArticle.slug,
            tags: generatedArticle.tags,
            keywords: generatedArticle.keywords,
            read_time: generatedArticle.readTime,
            status: 'draft',
          }).select().single();

          if (saved) {
            setArticleSavedId(saved.id);
            updateStep('saving', { status: 'done' });
          } else {
            updateStep('saving', { status: 'error', detail: 'Falha ao salvar' });
          }
        }
      } catch {
        updateStep('saving', { status: 'error', detail: 'Erro ao salvar' });
      }

      // Skip conclusion, cover, gallery for now (edge functions not available)
      updateStep('conclusion', { status: 'done', detail: 'Pular (edge function não disponível)' });
      updateStep('cover', { status: 'done', detail: 'Pular (edge function não disponível)' });
      updateStep('gallery', { status: 'done', detail: 'Pular (edge function não disponível)' });

      setIsGenerating(false);
      return generatedArticle;

    } catch (error) {
      console.error('Generation error:', error);
      setIsGenerating(false);
      toast({ title: 'Erro na geração', description: (error as Error).message, variant: 'destructive' });
      return null;
    }
  }, [toast, resetGeneration, updateStep]);

  const saveArticle = useCallback(async (publish: boolean): Promise<{ id: string } | null> => {
    if (!article) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      if (articleSavedId) {
        await (supabase as any).from('content_articles').update({
          title: article.title,
          body: article.content,
          excerpt: article.excerpt,
          status: publish ? 'published' : 'draft',
          published_at: publish ? new Date().toISOString() : null,
        }).eq('id', articleSavedId);

        if (publish) {
          toast({ title: '✅ Artigo publicado!' });
          clearPersistedStateFn();
        } else {
          toast({ title: '💾 Rascunho salvo!' });
        }
        return { id: articleSavedId };
      }

      return null;
    } catch (error) {
      toast({ title: 'Erro ao salvar', description: (error as Error).message, variant: 'destructive' });
      return null;
    }
  }, [article, articleSavedId, toast]);

  return {
    isGenerating,
    article,
    steps,
    startTime,
    currentTopic,
    generateArticle,
    saveArticle,
    resetGeneration,
    cancelGeneration,
    setArticle,
    clearPersistedArticle: clearPersistedStateFn,
    setCurrentTopic,
  };
}
