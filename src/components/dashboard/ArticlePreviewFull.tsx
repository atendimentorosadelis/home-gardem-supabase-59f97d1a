import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Clock, Tag, FileText, Image, Link2, Heart, Sparkles, Loader2 } from 'lucide-react';
import { useEmotionalConclusion } from '@/hooks/use-emotional-conclusion';
import type { GeneratedArticle } from '@/hooks/use-full-article-generation';

interface ArticlePreviewFullProps {
  article: GeneratedArticle;
  articleSavedId?: string | null;
}

export function ArticlePreviewFull({ article, articleSavedId }: ArticlePreviewFullProps) {
  const {
    conclusion,
    isLoading: isLoadingConclusion,
    isGenerating: isGeneratingConclusion,
    fetchConclusion,
    generateConclusion,
  } = useEmotionalConclusion(articleSavedId || undefined);

  useEffect(() => {
    if (articleSavedId) {
      fetchConclusion();
    }
  }, [articleSavedId, fetchConclusion]);

  const handleGenerateConclusion = async () => {
    await generateConclusion(article.title);
  };

  return (
    <div className="space-y-6">
      {/* Metadados do Artigo */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Metadados do Artigo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Título</span>
              <p className="text-base font-semibold text-foreground leading-snug">{article.title}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Slug</span>
              <p className="text-sm text-muted-foreground font-mono break-all">{article.slug}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Categoria</span>
              <div>
                <Badge variant="secondary" className="mt-1">{article.category}</Badge>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Leitura</span>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                <Clock className="h-3.5 w-3.5" />{article.readTime}
              </p>
            </div>
          </div>

          {article.excerpt && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Resumo</span>
              <p className="text-sm text-muted-foreground leading-relaxed">{article.excerpt}</p>
            </div>
          )}

          {article.tags.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="h-3 w-3" /> Tags
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {article.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {article.keywords && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Keywords (SEO)</span>
              <p className="text-sm text-muted-foreground font-mono">{article.keywords}</p>
            </div>
          )}

          {article.externalLinks && article.externalLinks.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="h-3 w-3" /> Links Externos
              </span>
              <div className="space-y-1">
                {article.externalLinks.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />{link.text}
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conclusão Emocional */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            Conclusão Emocional
          </CardTitle>
          <p className="text-sm text-muted-foreground">Texto poético gerado por IA para o card final do artigo</p>
        </CardHeader>
        <CardContent>
          {isLoadingConclusion ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : conclusion ? (
            <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
              <p className="text-sm text-foreground leading-relaxed italic">
                "{conclusion.conclusion_text}"
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 gap-4">
              <Heart className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Nenhuma conclusão emocional gerada ainda</p>
              <Button
                onClick={handleGenerateConclusion}
                disabled={isGeneratingConclusion || !articleSavedId}
                className="rounded-xl bg-pink-500 hover:bg-pink-600 text-white"
              >
                {isGeneratingConclusion ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" />Gerar Conclusão Emocional</>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conteúdo do Artigo */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Conteúdo do Artigo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br/>') }}
          />
        </CardContent>
      </Card>

      {/* Galeria de Imagens */}
      {(article.coverImage || article.galleryImages.length > 0) && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              Galeria de Imagens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {article.coverImage && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Imagem de Capa</span>
                <div className="rounded-xl overflow-hidden border border-border/50">
                  <img src={article.coverImage} alt={article.title} className="w-full h-auto max-h-[400px] object-cover" />
                </div>
              </div>
            )}

            {article.galleryImages.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Galeria ({article.galleryImages.length} imagens)
                </span>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {article.galleryImages.map((img, i) => (
                    <div key={i} className="rounded-lg overflow-hidden border border-border/50">
                      <img src={img} alt={`Galeria ${i + 1}`} className="w-full h-40 object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
