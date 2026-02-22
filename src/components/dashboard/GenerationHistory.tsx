import { History, RefreshCw, Trash2, Check, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { GenerationHistoryItem } from '@/hooks/use-generation-history';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface GenerationHistoryProps {
  history: GenerationHistoryItem[];
  isLoading: boolean;
  onRegenerate: (topic: string) => void;
  onDelete: (id: string) => void;
  isGenerating: boolean;
}

export function GenerationHistory({ history, isLoading, onRegenerate, onDelete, isGenerating }: GenerationHistoryProps) {
  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5 text-primary" />Histórico de Gerações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5 text-primary" />Histórico de Gerações</CardTitle>
          <CardDescription>Nenhuma geração registrada ainda</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5 text-primary" />Histórico de Gerações</CardTitle>
        <CardDescription>{history.length} geração(ões) registrada(s)</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2">
            {history.map((item) => (
              <div key={item.id} className={cn("flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors")}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {item.status === 'success' ? <Check className="h-4 w-4 text-green-500 shrink-0" /> : <X className="h-4 w-4 text-destructive shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.article_title || item.topic}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {item.article_id && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link to={`/admin/articles/${item.article_id}`}><ExternalLink className="h-3.5 w-3.5" /></Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRegenerate(item.topic)} disabled={isGenerating}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
