import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ActiveCommemorativeDate } from '@/hooks/use-commemorative-dates';

interface CommemorativeDateAlertProps {
  dates: ActiveCommemorativeDate[];
  onGenerateArticle: (date: ActiveCommemorativeDate) => void;
}

function getAlertStyles(daysUntil: number) {
  if (daysUntil === 0) return { borderClass: 'border-destructive', badgeText: '🎉 É HOJE!', glowClass: '' };
  if (daysUntil === 1) return { borderClass: 'border-orange-500', badgeText: '⏰ Amanhã!', glowClass: '' };
  return { borderClass: 'border-yellow-500', badgeText: `📅 Faltam ${daysUntil} dias`, glowClass: '' };
}

export function CommemorativeDateAlert({ dates, onGenerateArticle }: CommemorativeDateAlertProps) {
  if (dates.length === 0) return null;

  return (
    <div className="space-y-3">
      {dates.map((date) => {
        const IconComp = date.icon;
        const styles = getAlertStyles(date.daysUntil);
        return (
          <Card key={date.id} className={cn('border-2 transition-all', styles.borderClass, styles.glowClass)}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <IconComp className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{date.label}</p>
                      <Badge variant="secondary" className="text-xs">{styles.badgeText}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{format(date.eventDate, "d 'de' MMMM", { locale: ptBR })}</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => onGenerateArticle(date)} className="shrink-0 gap-1">
                  <Sparkles className="h-3 w-3" />
                  Gerar
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
