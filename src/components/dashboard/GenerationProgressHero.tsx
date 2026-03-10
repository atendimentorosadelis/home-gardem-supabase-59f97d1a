import { Check, Loader2, X, Clock, Ban, Sparkles, Zap, RotateCcw } from 'lucide-react';
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
  onReset?: () => void;
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

function getStatusLabel(steps: GenerationStep[], isGenerating?: boolean): string {
  if (!isGenerating && steps.every(s => s.status === 'pending')) return 'Aguardando início';
  const loading = steps.find(s => s.status === 'loading');
  if (loading) return loading.label;
  if (steps.every(s => s.status === 'done')) return 'Concluído!';
  if (steps.some(s => s.status === 'error')) return 'Erro na geração';
  if (steps.some(s => s.status === 'cancelled')) return 'Cancelado';
  return 'Aguardando início';
}

export function GenerationProgressHero({ steps, startTime, isGenerating, onCancel, onReset, topic }: GenerationProgressHeroProps) {
  const [elapsed, setElapsed] = useState(0);
  const { getProviderShortLabel } = useImageProvider();
  const progress = calculateProgress(steps);
  
  const isCompleted = steps.length > 0 && steps.every(s => s.status === 'done');
  const hasError = steps.some(s => s.status === 'error');
  const hasStarted = steps.some(s => s.status !== 'pending');

  useEffect(() => {
    if (!startTime) return;
    // Keep timer running while generating; freeze final value when done
    if (!isGenerating && hasStarted) {
      setElapsed((Date.now() - startTime) / 1000);
      return;
    }
    if (!isGenerating) return;
    const interval = setInterval(() => setElapsed((Date.now() - startTime) / 1000), 1000);
    return () => clearInterval(interval);
  }, [startTime, isGenerating, hasStarted]);

  const getStepIcon = (status: GenerationStep['status']) => {
    switch (status) {
      case 'loading': return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'done': return <Check className="h-4 w-4 text-green-500" />;
      case 'error': return <X className="h-4 w-4 text-destructive" />;
      case 'cancelled': return <Ban className="h-4 w-4 text-muted-foreground" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Hide completely when no generation has started and not generating
  if (!hasStarted && !isGenerating) return null;

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            {isGenerating ? <Zap className="h-5 w-5 text-primary animate-pulse" /> : <Sparkles className="h-5 w-5 text-primary" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Geração de Artigo</h3>
            <p className="text-sm text-muted-foreground">
              {topic || 'Selecione um tema para começar'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {startTime && hasStarted && (
            <Badge variant={isCompleted ? "default" : hasError ? "destructive" : "secondary"}>
              {formatTime(elapsed)}
            </Badge>
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

      {/* Status + Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-foreground">{getStatusLabel(steps, isGenerating)}</span>
          <span className="font-bold text-primary">{progress}%</span>
        </div>
        <Progress value={progress} className="h-3 bg-muted [&>div]:bg-yellow-500" />
      </div>

      {/* Steps - Horizontal chips */}
      <div className="flex flex-wrap gap-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
              step.status === 'loading' && "border-primary/30 bg-primary/5",
              step.status === 'done' && "border-green-500/30 bg-green-500/5",
              step.status === 'error' && "border-destructive/30 bg-destructive/5",
              step.status === 'pending' && "border-border/50 bg-muted/30",
              step.status === 'cancelled' && "border-border/50 bg-muted/30 opacity-50"
            )}
          >
            {getStepIcon(step.status)}
            <span className={cn(
              "font-medium",
              step.status === 'pending' ? "text-muted-foreground" : "text-foreground"
            )}>
              {step.label}
            </span>
            {step.detail && step.status === 'error' && (
              <span className="text-xs text-destructive/80 max-w-[200px] truncate" title={step.detail}>
                ({step.detail})
              </span>
            )}
            {step.detail && step.status !== 'error' && step.status !== 'pending' && (
              <span className="text-xs text-muted-foreground">
                {step.detail}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
