import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface ArticleSEO {
  id: string;
  title: string;
  slug: string | null;
  score: number;
  criteria: {
    hasKeywords: boolean;
    hasExcerpt: boolean;
    hasOptimalExcerpt: boolean;
    hasCoverImage: boolean;
    hasOptimalContent: boolean;
  };
  views: number;
  published_at: string | null;
}

interface SEOArticleTableProps {
  articles: ArticleSEO[];
  isLoading: boolean;
}

export function SEOArticleTable({ articles, isLoading }: SEOArticleTableProps) {
  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base">Detalhes SEO por Artigo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {articles.slice(0, 20).map((article) => (
            <div key={article.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{article.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {article.criteria.hasKeywords ? <CheckCircle2 className="h-3 w-3 text-primary" /> : <XCircle className="h-3 w-3 text-muted-foreground" />}
                  {article.criteria.hasOptimalExcerpt ? <CheckCircle2 className="h-3 w-3 text-primary" /> : <XCircle className="h-3 w-3 text-muted-foreground" />}
                  {article.criteria.hasCoverImage ? <CheckCircle2 className="h-3 w-3 text-primary" /> : <XCircle className="h-3 w-3 text-muted-foreground" />}
                  {article.criteria.hasOptimalContent ? <CheckCircle2 className="h-3 w-3 text-primary" /> : <XCircle className="h-3 w-3 text-muted-foreground" />}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={article.score} className="w-16 h-1.5" />
                <Badge variant={article.score >= 75 ? 'default' : article.score >= 50 ? 'secondary' : 'outline'} className="text-xs">
                  {article.score}%
                </Badge>
              </div>
            </div>
          ))}
          {articles.length === 0 && (
            <p className="text-center text-muted-foreground py-4">Nenhum artigo publicado</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
