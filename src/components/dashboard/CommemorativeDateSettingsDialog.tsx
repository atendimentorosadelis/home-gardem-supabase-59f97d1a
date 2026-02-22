import { useState } from 'react';
import { Settings2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { COMMEMORATIVE_DATES, getEventDate } from '@/data/commemorative-dates';
import { useCommemorativeDateSettings } from '@/hooks/use-commemorative-date-settings';
import { cn } from '@/lib/utils';

export function CommemorativeDateSettingsDialog() {
  const [open, setOpen] = useState(false);
  const { settings, isLoading, isSaving, toggleSetting, enableAll, disableAll, isEnabled } = useCommemorativeDateSettings();
  const enabledCount = settings.filter(s => s.is_enabled).length;

  const groupedDates = {
    geral: COMMEMORATIVE_DATES.filter(d => d.category === 'geral'),
    jardim: COMMEMORATIVE_DATES.filter(d => d.category === 'jardim'),
    decoracao: COMMEMORATIVE_DATES.filter(d => d.category === 'decoracao'),
  };

  const categoryLabels: Record<string, string> = { geral: 'Datas Gerais', jardim: 'Jardim & Flores', decoracao: 'Decoração' };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Configurar
          <Badge variant="secondary" className="text-xs">{enabledCount}/{COMMEMORATIVE_DATES.length}</Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Datas Comemorativas</DialogTitle>
          <DialogDescription>Selecione quais datas devem mostrar alertas</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={enableAll} disabled={isSaving}>Ativar Todas</Button>
              <Button variant="outline" size="sm" onClick={disableAll} disabled={isSaving}>Desativar Todas</Button>
            </div>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-6">
                {Object.entries(groupedDates).map(([key, dates]) => (
                  <div key={key}>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">{categoryLabels[key]}</h4>
                    <div className="space-y-2">
                      {dates.map((date) => {
                        const IconComp = date.icon;
                        const eventDate = getEventDate(date);
                        return (
                          <div key={date.id} className={cn("flex items-center justify-between p-2 rounded-lg border border-border/50", isEnabled(date.id) && "bg-primary/5")}>
                            <div className="flex items-center gap-2">
                              <IconComp className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{date.label}</p>
                                <p className="text-xs text-muted-foreground">{format(eventDate, "d MMM", { locale: ptBR })}</p>
                              </div>
                            </div>
                            <Switch checked={isEnabled(date.id)} onCheckedChange={() => toggleSetting(date.id)} disabled={isSaving} />
                          </div>
                        );
                      })}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
