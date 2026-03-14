import React, { createContext, useContext } from 'react';
import { useFullArticleGeneration } from '@/hooks/use-full-article-generation';
import type { GeneratedArticle, GenerationStep } from '@/hooks/use-full-article-generation';

interface ArticleGenerationContextType {
  isGenerating: boolean;
  article: GeneratedArticle | null;
  articleSavedId: string | null;
  steps: GenerationStep[];
  startTime: number | null;
  currentTopic: string;
  generateArticle: (topic: string) => Promise<GeneratedArticle | null>;
  saveArticle: (publishNow?: boolean) => Promise<any>;
  resetGeneration: () => void;
  cancelGeneration: () => void;
  setArticle: React.Dispatch<React.SetStateAction<GeneratedArticle | null>>;
  clearPersistedArticle: () => void;
  setCurrentTopic: React.Dispatch<React.SetStateAction<string>>;
}

const ArticleGenerationContext = createContext<ArticleGenerationContextType | null>(null);

export function ArticleGenerationProvider({ children }: { children: React.ReactNode }) {
  const generation = useFullArticleGeneration();

  return (
    <ArticleGenerationContext.Provider value={generation}>
      {children}
    </ArticleGenerationContext.Provider>
  );
}

export function useArticleGeneration(): ArticleGenerationContextType {
  const context = useContext(ArticleGenerationContext);
  if (!context) {
    throw new Error('useArticleGeneration must be used within ArticleGenerationProvider');
  }
  return context;
}
