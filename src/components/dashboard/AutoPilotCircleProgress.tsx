// Stub - AutoPilotCircleProgress component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutoPilotCircleProgressProps {
  nextExecution: Date | null;
  isEnabled: boolean;
}

export function AutoPilotCircleProgress({ nextExecution, isEnabled }: AutoPilotCircleProgressProps) {
  const radius = 70;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;

  return (
    <Card className="border-border/50">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <div className="relative">
          <svg width={180} height={180} viewBox="0 0 180 180">
            <circle cx="90" cy="90" r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="none" className="text-muted/30" />
            <circle cx="90" cy="90" r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="none" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={circumference}
              className={cn("transition-all duration-1000", isEnabled ? "text-primary" : "text-muted-foreground")}
              transform="rotate(-90 90 90)" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Bot className={cn("h-8 w-8 mb-1", isEnabled ? "text-primary" : "text-muted-foreground")} />
            <Badge variant={isEnabled ? "default" : "secondary"} className="text-xs">
              {isEnabled ? "Ativo" : "Pausado"}
            </Badge>
          </div>
        </div>
        {nextExecution && (
          <p className="text-xs text-muted-foreground mt-3">
            Próxima execução: {nextExecution.toLocaleString('pt-BR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
