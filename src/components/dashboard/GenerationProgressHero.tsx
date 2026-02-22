import { Check, Loader2, X, Clock, Ban, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useImageProvider } from '@/hooks/use-image-provider';
import type { GenerationStep } from '@/hooks/use-full-article-generation';

interface GenerationProgressHeroProps {
  steps: GenerationStep[];
  startTime?: number;
  isGenerating?: boolean;
  onCancel?: () => void;
  topic?: string;
}

function calculateProgress(steps: GenerationStep[]): number {
  if (steps.length === 0) return 0;
  let totalProgress = 0;
  for (const step of steps) {
    const stepWeight = 100 / steps.length;
    if (step.status === 'done') totalProgress += stepWeight;
    else if (step.status === 'error') totalProgress += stepWeight;
    else if (step.status === 'loading') {
      if (step.detail && step.detail.includes('/')) {
        const [current, total] = step.detail.split('/').map(Number);
        if (!isNaN(current) && !isNaN(total) && total > 0) totalProgress += stepWeight * (current / total);
        else totalProgress += stepWeight * 0.5;
      } else totalProgress += stepWeight * 0.5;
    }
  }
  return Math.round(totalProgress);
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.ceil(seconds % 60);
  return remainingSeconds === 0 ? `${minutes}min` : `${minutes}min ${remainingSeconds}s`;
}

export function GenerationProgressHero({ steps, startTime, isGenerating, onCancel, topic }: GenerationProgressHeroProps) {
  const [elapsed, setElapsed] = useState(0);
  const { getProviderShortLabel } = useImageProvider();
  const progress = calculateProgress(steps);
  const allPending = steps.every(s => s.status === 'pending');

  useEffect(() => {
    if (!startTime || !isGenerating) return;
    const interval = setInterval(() => setElapsed((Date.now() - startTime) / 1000), 1000);
    return () => clearInterval(interval);
  }, [startTime, isGenerating]);

  if (allPending && !isGenerating) return null;

  const getStepIcon = (status: GenerationStep['status']) => {
    switch (status) {
      case 'loading': return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'done': return <Check className="h-5 w-5 text-green-500" />;
      case 'error': return <X className="h-5 w-5 text-destructive" />;
      case 'cancelled': return <Ban className="h-5 w-5 text-muted-foreground" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            {isGenerating ? <Zap className="h-5 w-5 text-primary animate-pulse" /> : <Sparkles className="h-5 w-5 text-primary" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {isGenerating ? 'Gerando artigo...' : progress >= 100 ? 'Artigo gerado!' : 'Progresso'}
            </h3>
            {topic && <p className="text-sm text-muted-foreground truncate max-w-[300px]">{topic}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isGenerating && startTime && (
            <Badge variant="secondary">{formatTime(elapsed)}</Badge>
          )}
          <Badge variant="outline">{getProviderShortLabel()}</Badge>
          {isGenerating && onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-destructive">
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium text-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.id} className={cn("flex items-center gap-3 p-2 rounded-lg transition-colors", step.status === 'loading' && "bg-primary/5")}>
            {getStepIcon(step.status)}
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", step.status === 'pending' ? "text-muted-foreground" : "text-foreground")}>{step.label}</p>
              {step.detail && <p className="text-xs text-muted-foreground">{step.detail}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
