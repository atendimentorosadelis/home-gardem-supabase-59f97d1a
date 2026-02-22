import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface GenerationStep {
  id: string; label: string;
  status: 'pending' | 'loading' | 'done' | 'error' | 'cancelled';
  detail?: string;
}

export interface GenerationJob {
  id: string; user_id: string; topic: string;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled';
  steps: GenerationStep[]; article_id: string | null;
  error_message: string | null; created_at: string; updated_at: string;
}

export function useGenerationJob() {
  const [job] = useState<GenerationJob | null>(null);
  const [currentJobId] = useState<string | null>(null);
  const [isPolling] = useState(false);
  const { toast } = useToast();

  const startGeneration = useCallback(async (_topic: string): Promise<string | null> => {
    toast({ title: 'Use a página de geração', description: 'Por favor, use a página "Gerar Conteúdo" para criar artigos.' });
    return null;
  }, [toast]);

  const cancelJob = useCallback(async () => {}, []);
  const clearJob = useCallback(() => {}, []);

  return {
    job, jobId: currentJobId, isGenerating: false, isComplete: false,
    hasFailed: false, isPolling, steps: [] as GenerationStep[],
    startTime: null, articleId: null, topic: '',
    startGeneration, cancelJob, clearJob,
  };
}
