import { useEffect, useState } from 'react';
import { Check, Loader2, X, Clock, Zap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'done' | 'error';
}

interface AutoPilotGenerationProgressProps {
  isRunning: boolean;
  result?: { success?: boolean; title?: string; message?: string } | null;
  error?: string | null;
}

const GENERATION_STEPS: ProgressStep[] = [
  { id: 'init', label: 'Inicializando', status: 'pending' },
  { id: 'topic', label: 'Selecionando tema', status: 'pending' },
  { id: 'article', label: 'Gerando artigo', status: 'pending' },
  { id: 'images', label: 'Gerando imagens', status: 'pending' },
  { id: 'publish', label: 'Publicando', status: 'pending' },
];

// Estimated durations per step in seconds
const STEP_DURATIONS = [3, 5, 60, 90, 10];

export function AutoPilotGenerationProgress({ isRunning, result, error }: AutoPilotGenerationProgressProps) {
  const [steps, setSteps] = useState<ProgressStep[]>(GENERATION_STEPS.map(s => ({ ...s })));
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Reset and start when isRunning becomes true
  useEffect(() => {
    if (isRunning) {
      setSteps(GENERATION_STEPS.map(s => ({ ...s, status: 'pending' })));
      setStartTime(Date.now());
      setElapsed(0);
    }
  }, [isRunning]);

  // Timer
  useEffect(() => {
    if (!startTime || (!isRunning && result)) return;
    if (!isRunning) {
      setElapsed((Date.now() - startTime) / 1000);
      return;
    }
    const interval = setInterval(() => setElapsed((Date.now() - startTime) / 1000), 1000);
    return () => clearInterval(interval);
  }, [startTime, isRunning, result]);

  // Simulate step progression based on elapsed time
  useEffect(() => {
    if (!isRunning && !result && !error) return;

    if (error || (result && !result.success)) {
      // Find the current loading step and mark it as error
      setSteps(prev => {
        const updated = [...prev];
        const loadingIdx = updated.findIndex(s => s.status === 'loading');
        if (loadingIdx >= 0) updated[loadingIdx].status = 'error';
        else {
          // Mark last pending as error
          const lastDone = updated.filter(s => s.status === 'done').length;
          if (lastDone < updated.length) updated[lastDone].status = 'error';
        }
        return updated;
      });
      return;
    }

    if (result?.success) {
      setSteps(prev => prev.map(s => ({ ...s, status: 'done' as const })));
      return;
    }

    if (!isRunning) return;

    // Determine which step should be active based on elapsed time
    let accumulated = 0;
    const newSteps = GENERATION_STEPS.map((s, i) => {
      const stepEnd = accumulated + STEP_DURATIONS[i];
      let status: ProgressStep['status'] = 'pending';
      if (elapsed >= stepEnd) status = 'done';
      else if (elapsed >= accumulated) status = 'loading';
      accumulated = stepEnd;
      return { ...s, status };
    });

    setSteps(newSteps);
  }, [elapsed, isRunning, result, error]);

  const progress = (() => {
    const doneCount = steps.filter(s => s.status === 'done').length;
    const loadingCount = steps.filter(s => s.status === 'loading').length;
    return Math.round(((doneCount + loadingCount * 0.5) / steps.length) * 100);
  })();

  const isCompleted = steps.every(s => s.status === 'done');
  const hasError = steps.some(s => s.status === 'error');

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    const min = Math.floor(seconds / 60);
    const sec = Math.ceil(seconds % 60);
    return sec === 0 ? `${min}min` : `${min}min ${sec}s`;
  };

  const currentLabel = (() => {
    if (isCompleted) return 'Concluído!';
    if (hasError) return 'Erro na geração';
    const loading = steps.find(s => s.status === 'loading');
    return loading?.label || 'Aguardando...';
  })();

  // Don't render if never started
  if (!startTime) return null;

  return (
    <Card className={cn(
      "border-2 transition-all duration-500",
      isRunning ? "border-primary/30 shadow-lg shadow-primary/5" :
      isCompleted ? "border-emerald-500/30" :
      hasError ? "border-destructive/30" : "border-border"
    )}>
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isRunning ? "bg-primary/10" : isCompleted ? "bg-emerald-500/10" : "bg-destructive/10"
            )}>
              {isRunning ? (
                <Zap className="h-5 w-5 text-primary animate-pulse" />
              ) : isCompleted ? (
                <Sparkles className="h-5 w-5 text-emerald-500" />
              ) : (
                <X className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-foreground">Geração em Andamento</h3>
              <p className="text-xs text-muted-foreground">
                {result?.title || 'Criando artigo automaticamente...'}
              </p>
            </div>
          </div>
          {startTime && (
            <Badge variant={isCompleted ? "default" : hasError ? "destructive" : "secondary"}>
              {formatTime(elapsed)}
            </Badge>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-foreground">{currentLabel}</span>
            <span className="font-bold text-primary">{progress}%</span>
          </div>
          <Progress
            value={progress}
            className={cn(
              "h-3 bg-muted",
              isCompleted ? "[&>div]:bg-emerald-500" : hasError ? "[&>div]:bg-destructive" : "[&>div]:bg-primary"
            )}
          />
        </div>

        {/* Steps chips */}
        <div className="flex flex-wrap gap-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                step.status === 'loading' && "border-primary/30 bg-primary/5 text-foreground",
                step.status === 'done' && "border-emerald-500/30 bg-emerald-500/5 text-foreground",
                step.status === 'error' && "border-destructive/30 bg-destructive/5 text-foreground",
                step.status === 'pending' && "border-border/50 bg-muted/30 text-muted-foreground"
              )}
            >
              {step.status === 'loading' && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              {step.status === 'done' && <Check className="h-3 w-3 text-emerald-500" />}
              {step.status === 'error' && <X className="h-3 w-3 text-destructive" />}
              {step.status === 'pending' && <Clock className="h-3 w-3 text-muted-foreground" />}
              {step.label}
            </div>
          ))}
        </div>

        {/* Error/Success message */}
        {error && (
          <p className="text-sm text-destructive bg-destructive/5 rounded-lg p-3">{error}</p>
        )}
        {result?.success && result.title && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 rounded-lg p-3">
            ✅ Artigo "{result.title}" criado com sucesso!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
