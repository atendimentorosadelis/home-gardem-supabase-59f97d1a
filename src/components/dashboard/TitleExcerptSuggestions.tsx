import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Check, Sparkles } from 'lucide-react';
import { invokeEdgeFunction } from '@/lib/edge-functions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TitleExcerptSuggestionsProps {
  type: 'title' | 'excerpt' | 'both';
  currentTitle: string;
  currentExcerpt: string;
  body: string;
  category: string;
  onSelectTitle?: (title: string) => void;
  onSelectExcerpt?: (excerpt: string) => void;
  onSelectBoth?: (title: string, excerpt: string) => void;
}

type SuggestionItem = string | { title: string; excerpt: string };

export function TitleExcerptSuggestionButton({
  type,
  currentTitle,
  currentExcerpt,
  body,
  category,
  onSelectTitle,
  onSelectExcerpt,
  onSelectBoth,
}: TitleExcerptSuggestionsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  const label = type === 'title' ? 'Título' : type === 'excerpt' ? 'Resumo' : 'Título e Resumo';

  const fetchSuggestions = async () => {
    setLoading(true);
    setSuggestions([]);
    setSelected(null);
    try {
      const { data, error } = await invokeEdgeFunction('generate-title-suggestions', {
        title: currentTitle,
        excerpt: currentExcerpt,
        body,
        category,
        type,
      }, true);

      if (error) throw error;
      if (data?.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        throw new Error('Nenhuma sugestão recebida');
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      toast.error('Erro ao gerar sugestões');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    fetchSuggestions();
  };

  const handleSelect = (index: number) => {
    setSelected(index);
  };

  const handleConfirm = () => {
    if (selected === null) return;
    const item = suggestions[selected];

    if (type === 'title' && typeof item === 'string' && onSelectTitle) {
      onSelectTitle(item);
    } else if (type === 'excerpt' && typeof item === 'string' && onSelectExcerpt) {
      onSelectExcerpt(item);
    } else if (type === 'both' && typeof item === 'object' && onSelectBoth) {
      onSelectBoth(item.title, item.excerpt);
    }

    toast.success(`${label} atualizado!`);
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
        onClick={handleOpen}
        title={`Refazer ${label}`}
      >
        <Sparkles className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Sugestões de {label}
            </DialogTitle>
            <DialogDescription>
              Escolha uma das opções geradas por IA ou gere novas sugestões
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {/* Current value */}
            <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground mb-1">Atual</p>
              {type === 'both' ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{currentTitle || 'Sem título'}</p>
                  <p className="text-xs text-muted-foreground">{currentExcerpt || 'Sem resumo'}</p>
                </div>
              ) : (
                <p className="text-sm">{type === 'title' ? currentTitle : currentExcerpt || 'Vazio'}</p>
              )}
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Gerando sugestões...</p>
              </div>
            )}

            {/* Suggestions */}
            {!loading && suggestions.length > 0 && (
              <div className="space-y-2">
                {suggestions.map((item, idx) => {
                  const isSelected = selected === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelect(idx)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border-2 transition-all duration-200",
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border/50 hover:border-primary/30 hover:bg-accent/50"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className={cn(
                          "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 transition-colors",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {isSelected ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          {typeof item === 'string' ? (
                            <p className="text-sm">{item}</p>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-sm font-semibold">{item.title}</p>
                              <p className="text-xs text-muted-foreground">{item.excerpt}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchSuggestions}
                disabled={loading}
                className="gap-1.5"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                Gerar Novas
              </Button>
              <div className="flex-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirm}
                disabled={selected === null}
                className="gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                Usar Selecionado
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
