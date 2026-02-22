import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { invokeEdgeFunction } from '@/lib/edge-functions';
import { toast } from 'sonner';

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
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[useFullArticleGeneration] Failed to load persisted state:', e);
  }
  return null;
}

function savePersistedState(state: PersistedState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[useFullArticleGeneration] Failed to save persisted state:', e);
  }
}

function clearPersistedState() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('[useFullArticleGeneration] Failed to clear persisted state:', e);
  }
}

const DEFAULT_STEPS: GenerationStep[] = [
  { id: 'metadata', label: 'Gerando metadados e conteúdo', status: 'pending' },
  { id: 'saving', label: 'Salvando rascunho', status: 'pending' },
  { id: 'conclusion', label: 'Gerando conclusão emocional', status: 'pending' },
  { id: 'cover', label: 'Criando imagem de capa', status: 'pending' },
  { id: 'gallery', label: 'Gerando galeria de imagens', status: 'pending', detail: '0/6' },
];

export function useFullArticleGeneration() {
  // Load persisted state on mount
  const persistedState = loadPersistedState();

  // Check if there are steps still in loading state (generation was interrupted)
  const hasLoadingSteps = persistedState?.steps?.some(s => s.status === 'loading') ?? false;

  // Restore isGenerating if it was persisted OR if there are loading steps
  const [isGenerating, setIsGenerating] = useState(persistedState?.isGenerating ?? hasLoadingSteps);
  const [article, setArticle] = useState<GeneratedArticle | null>(persistedState?.article ?? null);
  const [startTime, setStartTime] = useState<number | null>(persistedState?.startTime ?? null);
  const [articleSavedId, setArticleSavedId] = useState<string | null>(persistedState?.articleSavedId ?? null);
  const [steps, setSteps] = useState<GenerationStep[]>(persistedState?.steps ?? DEFAULT_STEPS);
  const [currentTopic, setCurrentTopic] = useState<string>(persistedState?.topic ?? '');

  const cancelledRef = useRef(false);
  const isAutoSavingRef = useRef(false);
  // Using sonner toast (imported at top level)

  // Persist state whenever it changes - persist during generation too!
  useEffect(() => {
    // Always persist if there's meaningful state (article, steps with progress, or generating)
    const hasProgress = steps.some(s => s.status !== 'pending');
    if (article || isGenerating || hasProgress) {
      savePersistedState({
        article,
        articleSavedId,
        steps,
        startTime,
        isGenerating,
        topic: currentTopic,
      });
    }
  }, [article, articleSavedId, steps, startTime, isGenerating, currentTopic]);

  const updateStep = useCallback((id: string, updates: Partial<GenerationStep>) => {
    setSteps(prev => prev.map(step =>
      step.id === id ? { ...step, ...updates } : step
    ));
  }, []);

  const resetGeneration = useCallback(() => {
    setArticle(null);
    setStartTime(null);
    setArticleSavedId(null);
    setCurrentTopic('');
    cancelledRef.current = false;
    setSteps(DEFAULT_STEPS);
    clearPersistedState();
  }, []);

  const cancelGeneration = useCallback(() => {
    cancelledRef.current = true;
    setIsGenerating(false);

    // Mark loading steps as cancelled
    setSteps(prev => prev.map(step =>
      step.status === 'loading' || step.status === 'pending'
        ? { ...step, status: 'cancelled' }
        : step
    ));

    toast.info('Geração cancelada: A geração do artigo foi interrompida.');
  }, []);

  const generateArticle = useCallback(async (topic: string) => {
    if (!topic.trim()) {
      toast.error('Tema obrigatório: Por favor, informe um tema para o artigo.');
      return null;
    }

    setIsGenerating(true);
    setCurrentTopic(topic);
    resetGeneration();
    setCurrentTopic(topic); // Set again after reset
    setStartTime(Date.now());

    try {
      // ============================================
      // ORDEM CORRETA DE GERAÇÃO:
      // 1. Gera metadados e conteúdo
      // 2. Salva artigo para obter article_id
      // 3. Gera conclusão emocional
      // 4. Injeta conclusão no body do artigo
      // 5. Gera imagem de capa
      // 6. Gera galeria de imagens
      // ============================================

      // Step 1: Generate article content and metadata
      updateStep('metadata', { status: 'loading' });

      const { data: articleData, error: articleError } = await invokeEdgeFunction(
        'generate-full-article',
        { topic }
      );

      if (cancelledRef.current) return null;

      if (articleError || !articleData?.success) {
        throw new Error(articleData?.error || articleError?.message || 'Failed to generate article');
      }

      // Helper to detect placeholder text from OpenAI
      const isPlaceholder = (text: string | undefined): boolean => {
        if (!text) return true;
        const placeholderPatterns = [
          'ENGLISH description',
          'escreva aqui',
          'write here',
          'Example:',
          'ex:',
          'e.g.',
          'MAIN SUBJECT first',
        ];
        return placeholderPatterns.some(pattern =>
          text.toLowerCase().includes(pattern.toLowerCase())
        );
      };

      // Clean visual metadata - remove placeholders
      const cleanMainSubject = isPlaceholder(articleData.article.mainSubject)
        ? ''
        : articleData.article.mainSubject;
      const cleanVisualContext = isPlaceholder(articleData.article.visualContext)
        ? ''
        : articleData.article.visualContext;
      const cleanGalleryPrompts = (articleData.article.galleryPrompts || [])
        .filter((p: string) => !isPlaceholder(p));

      const generatedArticle: GeneratedArticle = {
        ...articleData.article,
        mainSubject: cleanMainSubject || '',
        visualContext: cleanVisualContext || '',
        galleryPrompts: cleanGalleryPrompts,
        coverImage: undefined,
        galleryImages: [],
      };

      console.log('Generated article with main subject:', generatedArticle.mainSubject || '(empty - will use title fallback)');
      console.log('Generated article with visual context:', generatedArticle.visualContext || '(empty - will use category fallback)');

      setArticle(generatedArticle);
      updateStep('metadata', { status: 'done' });

      if (cancelledRef.current) return generatedArticle;

      // Step 2: SAVE ARTICLE FIRST to get the article_id
      updateStep('saving', { status: 'loading' });

      let savedArticleId: string | null = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (profile) {
            // Check if article with this slug already exists
            const { data: existingDraft } = await supabase
              .from('content_articles')
              .select('id')
              .eq('slug', generatedArticle.slug)
              .maybeSingle();

            const articleRecord = {
              author_id: profile.id,
              title: generatedArticle.title,
              body: generatedArticle.content,
              excerpt: generatedArticle.excerpt,
              category: generatedArticle.category,
              category_slug: generatedArticle.categorySlug,
              slug: generatedArticle.slug,
              cover_image: null,
              gallery_images: [],
              tags: generatedArticle.tags,
              keywords: generatedArticle.keywords,
              read_time: generatedArticle.readTime,
              status: 'draft',
              published_at: null,
            };

            let savedArticle;

            if (existingDraft) {
              const result = await supabase
                .from('content_articles')
                .update(articleRecord)
                .eq('id', existingDraft.id)
                .select()
                .single();
              savedArticle = result.data;
            } else {
              const result = await supabase
                .from('content_articles')
                .insert(articleRecord)
                .select()
                .single();
              savedArticle = result.data;
            }

            if (savedArticle) {
              savedArticleId = savedArticle.id;
              setArticleSavedId(savedArticle.id);
              console.log('[Generation] Article saved with ID:', savedArticleId);
              updateStep('saving', { status: 'done' });
            } else {
              updateStep('saving', { status: 'error', detail: 'Falha' });
            }
          }
        }
      } catch (saveError) {
        console.error('[Generation] Initial save error:', saveError);
        updateStep('saving', { status: 'error', detail: 'Erro' });
      }

      if (cancelledRef.current) return generatedArticle;

      // Step 3: Generate emotional conclusion WITH article_id
      updateStep('conclusion', { status: 'loading' });

      let emotionalConclusionText = '';
      try {
        const articleTheme = generatedArticle.title || generatedArticle.mainSubject || topic;
        console.log('[Generation] Generating emotional conclusion with theme:', articleTheme);
        console.log('[Generation] Using article_id:', savedArticleId);

        const { data: conclusionData, error: conclusionError } = await invokeEdgeFunction<{
          emotional_text: string;
          saved?: boolean;
          error?: string;
        }>(
          'generate-emotional-conclusion',
          {
            theme: articleTheme,
            article_id: savedArticleId  // NOW we have the real ID!
          }
        );

        if (cancelledRef.current) return generatedArticle;

        if (conclusionError || !conclusionData?.emotional_text) {
          console.error('[Generation] Emotional conclusion error:', conclusionError || conclusionData?.error);
          updateStep('conclusion', { status: 'error', detail: 'Falha' });
        } else {
          emotionalConclusionText = conclusionData.emotional_text;
          console.log('[Generation] Emotional conclusion generated:', emotionalConclusionText.substring(0, 80) + '...');
          console.log('[Generation] Saved to DB:', conclusionData.saved);
          updateStep('conclusion', { status: 'done' });
        }
      } catch (conclusionErr) {
        console.error('[Generation] Emotional conclusion error:', conclusionErr);
        updateStep('conclusion', { status: 'error', detail: 'Erro' });
      }

      // Step 4: Inject emotional conclusion into article body AND update in database
      if (emotionalConclusionText) {
        const conclusionCard = `\n\n## ✨ Reflexão Final\n\n> ${emotionalConclusionText}\n\n`;

        // Find the FAQ section to insert before it
        const faqMatch = generatedArticle.content.match(/##\s*(FAQ|Perguntas\s+Frequentes)/i);

        if (faqMatch && faqMatch.index !== undefined) {
          generatedArticle.content =
            generatedArticle.content.substring(0, faqMatch.index) +
            conclusionCard +
            generatedArticle.content.substring(faqMatch.index);
          console.log('[Generation] Emotional conclusion injected before FAQ');
        } else {
          generatedArticle.content += conclusionCard;
          console.log('[Generation] Emotional conclusion appended at the end');
        }

        // Update article state with new content
        setArticle({ ...generatedArticle });

        // Update the saved article in database with the new body
        if (savedArticleId) {
          try {
            await supabase
              .from('content_articles')
              .update({ body: generatedArticle.content })
              .eq('id', savedArticleId);
            console.log('[Generation] Article body updated with emotional conclusion');
          } catch (updateErr) {
            console.error('[Generation] Failed to update article body:', updateErr);
          }
        }
      }

      if (cancelledRef.current) return generatedArticle;

      // Step 5: Generate cover image
      updateStep('cover', { status: 'loading', detail: 'Iniciando...' });

      const { data: coverData, error: coverError } = await invokeEdgeFunction(
        'generate-article-image',
        {
          title: generatedArticle.title,
          category: generatedArticle.categorySlug,
          tags: generatedArticle.tags,
          type: 'cover',
          mainSubject: generatedArticle.mainSubject,
          visualContext: generatedArticle.visualContext
        }
      );

      if (cancelledRef.current) return generatedArticle;

      if (coverError || !coverData?.success) {
        console.error('Cover image error:', coverError || coverData?.error);
        updateStep('cover', { status: 'error', detail: 'Falha' });
        toast.error('Não foi possível gerar a imagem de capa.');
      } else {
        generatedArticle.coverImage = coverData.imageUrl;
        setArticle({ ...generatedArticle });
        // Show which AI provider was used
        const providerLabel = coverData.provider || (coverData.usedFallback ? 'Cloudflare' : 'Replicate');
        updateStep('cover', { status: 'done', detail: providerLabel });
      }

      if (cancelledRef.current) return generatedArticle;

      // Step 6: Generate gallery images (6 images)
      updateStep('gallery', { status: 'loading', detail: '0/6' });

      const galleryPrompts = generatedArticle.galleryPrompts || [];
      const galleryImages: string[] = [];
      let lastProvider = '';

      for (let i = 0; i < Math.min(galleryPrompts.length, 6); i++) {
        if (cancelledRef.current) break;

        try {
          const { data: galleryData, error: galleryError } = await invokeEdgeFunction(
            'generate-article-image',
            {
              title: generatedArticle.title,
              category: generatedArticle.categorySlug,
              tags: generatedArticle.tags,
              type: 'gallery',
              customPrompt: galleryPrompts[i],
              mainSubject: generatedArticle.mainSubject,
              visualContext: generatedArticle.visualContext
            }
          );

          if (cancelledRef.current) break;

          if (!galleryError && galleryData?.success) {
            galleryImages.push(galleryData.imageUrl);
            // Track the provider used
            lastProvider = galleryData.provider || (galleryData.usedFallback ? 'Cloudflare' : 'Replicate');
          }

          // Show progress with provider info
          const providerInfo = lastProvider ? ` (${lastProvider})` : '';
          updateStep('gallery', { detail: `${galleryImages.length}/6${providerInfo}` });

          // Update article with current gallery
          generatedArticle.galleryImages = [...galleryImages];
          setArticle({ ...generatedArticle });

        } catch (err) {
          console.error(`Gallery image ${i + 1} error:`, err);
        }
      }

      if (!cancelledRef.current) {
        updateStep('gallery', {
          status: galleryImages.length > 0 ? 'done' : 'error',
          detail: `${galleryImages.length}/6`
        });
      }

      if (!cancelledRef.current) {
        toast.success(`Artigo gerado com sucesso! "${generatedArticle.title}" está pronto para revisão.`);
      }

      // Final update: Save images to the already-saved article
      if (!cancelledRef.current && savedArticleId && generatedArticle) {
        isAutoSavingRef.current = true;
        try {
          const finalCoverImage = generatedArticle.coverImage;
          const finalGalleryImages = generatedArticle.galleryImages || [];

          console.log('[Final-save] Updating article with images:', savedArticleId);
          console.log('[Final-save] Cover image:', finalCoverImage || 'NOT SET');
          console.log('[Final-save] Gallery images count:', finalGalleryImages.length);

          const { error: updateError } = await supabase
            .from('content_articles')
            .update({
              cover_image: finalCoverImage || null,
              gallery_images: finalGalleryImages,
            })
            .eq('id', savedArticleId);

          if (updateError) {
            console.error('[Final-save] Error updating images:', updateError);
          } else {
            console.log('[Final-save] Article updated with images successfully');

            // Notify admins
            await invokeEdgeFunction('notify-article-ready', {
              articleId: savedArticleId,
              articleTitle: generatedArticle.title,
              articleSlug: generatedArticle.slug,
            });

            toast.success('Rascunho salvo automaticamente. Os administradores foram notificados.');
          }
        } catch (finalSaveError) {
          console.error('[Final-save] Error:', finalSaveError);
        } finally {
          isAutoSavingRef.current = false;
        }
      }

      return generatedArticle;

    } catch (error) {
      if (cancelledRef.current) return null;

      console.error('Article generation error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      // Mark current step as error
      setSteps(prev => prev.map(step =>
        step.status === 'loading' ? { ...step, status: 'error' } : step
      ));

      toast.error(`Erro ao gerar artigo: ${errorMessage}`);

      return null;
    } finally {
      if (!cancelledRef.current) {
        setIsGenerating(false);
      }
    }
  }, [updateStep, resetGeneration]);

  // Ref to prevent double-clicks on mobile
  const isSavingRef = useRef(false);

  const saveArticle = useCallback(async (publishNow: boolean = false) => {
    if (!article) {
      toast.error('Nenhum artigo para salvar. Gere um artigo primeiro.');
      return null;
    }

    // Prevent double-clicks (especially on mobile)
    if (isSavingRef.current) {
      console.log('[saveArticle] Save already in progress, ignoring duplicate call');
      return null;
    }

    isSavingRef.current = true;

    try {
      // Aguardar auto-save completar se estiver em progresso (máximo 10s)
      if (isAutoSavingRef.current) {
        console.log('[saveArticle] Waiting for auto-save to complete...');
        for (let i = 0; i < 20; i++) {
          if (!isAutoSavingRef.current) {
            console.log('[saveArticle] Auto-save completed, proceeding');
            break;
          }
          await new Promise(r => setTimeout(r, 500));
        }
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Não autenticado. Faça login para salvar artigos.');
        return null;
      }

      // Get profile id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new Error('Perfil não encontrado');
      }

      // Log valores para debug
      console.log('[saveArticle] Starting save, publishNow:', publishNow);
      console.log('[saveArticle] Cover image:', article.coverImage || 'NOT SET');
      console.log('[saveArticle] Gallery images:', article.galleryImages?.length || 0);
      console.log('[saveArticle] Slug:', article.slug);
      console.log('[saveArticle] Cached articleSavedId:', articleSavedId);

      // Primeiro: usar o ID cacheado se disponível (evita lookup desnecessário)
      let targetArticleId: string | null = articleSavedId;

      // Se não temos ID cacheado, verificar pelo slug
      if (!targetArticleId) {
        const { data: existingArticle, error: lookupError } = await supabase
          .from('content_articles')
          .select('id')
          .eq('slug', article.slug)
          .maybeSingle();

        if (lookupError) {
          console.error('[saveArticle] Lookup error:', lookupError);
          throw lookupError;
        }

        targetArticleId = existingArticle?.id || null;
      }

      const articleRecord = {
        author_id: profile.id,
        title: article.title,
        body: article.content,
        excerpt: article.excerpt,
        category: article.category,
        category_slug: article.categorySlug,
        slug: article.slug,
        cover_image: article.coverImage || null,
        gallery_images: article.galleryImages || [],
        tags: article.tags,
        keywords: article.keywords,
        read_time: article.readTime,
        status: publishNow ? 'published' : 'draft',
        published_at: publishNow ? new Date().toISOString() : null,
      };

      let data;
      let error;

      if (targetArticleId) {
        // Article already exists - UPDATE it by ID
        console.log('[saveArticle] Article exists, updating ID:', targetArticleId);
        const result = await supabase
          .from('content_articles')
          .update(articleRecord)
          .eq('id', targetArticleId)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // New article - INSERT it
        console.log('[saveArticle] New article, inserting...');
        const result = await supabase
          .from('content_articles')
          .insert(articleRecord)
          .select()
          .single();
        data = result.data;
        error = result.error;

        // Fallback: Se INSERT falhar com duplicate key (race condition), tentar UPDATE
        if (error?.code === '23505') {
          console.log('[saveArticle] Duplicate key detected, switching to UPDATE');
          const { data: existing } = await supabase
            .from('content_articles')
            .select('id')
            .eq('slug', article.slug)
            .single();

          if (existing) {
            const retryResult = await supabase
              .from('content_articles')
              .update(articleRecord)
              .eq('id', existing.id)
              .select()
              .single();
            data = retryResult.data;
            error = retryResult.error;
          }
        }
      }

      if (error) {
        throw error;
      }

      console.log('[saveArticle] Success! Article ID:', data?.id);

      // Atualizar o ID cacheado para futuras operações
      if (data?.id) {
        setArticleSavedId(data.id);
      }

      toast.success(publishNow ? 'Artigo publicado! O artigo está disponível no site.' : 'Rascunho salvo!');

      return data;

    } catch (error: any) {
      console.error('Save article error:', error);

      // Extract detailed error message
      let errorMessage = 'Erro desconhecido';
      if (error?.message) {
        errorMessage = error.message;
      }
      if (error?.code) {
        errorMessage += ` (Código: ${error.code})`;
      }
      if (error?.details) {
        errorMessage += ` - ${error.details}`;
      }
      if (error?.hint) {
        errorMessage += ` Dica: ${error.hint}`;
      }

      console.error('Detailed error info:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        status: error?.status,
        statusText: error?.statusText,
      });

      toast.error(`Erro ao salvar: ${errorMessage}`);
      return null;
    } finally {
      // Reset saving flag after a small delay to prevent rapid re-clicks
      setTimeout(() => {
        isSavingRef.current = false;
      }, 1000);
    }
  }, [article, articleSavedId]);

  // Clear persisted state (call after publishing)
  const clearPersistedArticle = useCallback(() => {
    clearPersistedState();
  }, []);

  return {
    isGenerating,
    article,
    articleSavedId,
    steps,
    startTime,
    currentTopic,
    generateArticle,
    saveArticle,
    resetGeneration,
    cancelGeneration,
    setArticle,
    clearPersistedArticle,
    setCurrentTopic,
  };
}
