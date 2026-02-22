import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy } from 'lucide-react';

export function TopArticlesRanking() {
  const { data: topArticles, isLoading } = useQuery({
    queryKey: ['top-articles-ranking'],
    queryFn: async () => {
      const { data: views } = await (supabase as any).from('article_views').select('article_id');
      const viewCounts: Record<string, number> = {};
      (views || []).forEach((v: any) => { viewCounts[v.article_id] = (viewCounts[v.article_id] || 0) + 1; });
      const topIds = Object.entries(viewCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
      if (topIds.length === 0) return [];
      const { data: articles } = await (supabase as any).from('content_articles').select('id, title, category').in('id', topIds.map(([id]) => id));
      return topIds.map(([id, count], index) => {
        const article = (articles || []).find((a: any) => a.id === id);
        return { id, title: article?.title || 'Artigo removido', category: article?.category || '', views: count, rank: index + 1 };
      });
    },
  });

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" />Top Artigos</CardTitle>
        <CardDescription>Artigos mais visualizados</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : topArticles && topArticles.length > 0 ? (
          <div className="space-y-3">
            {topArticles.map((article: any) => (
              <div key={article.id} className="flex items-center gap-3">
                <span className="text-lg font-bold text-muted-foreground w-6">{article.rank}</span>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{article.title}</p><p className="text-xs text-muted-foreground">{article.category}</p></div>
                <Badge variant="secondary">{article.views} views</Badge>
              </div>
            ))}
          </div>
        ) : <p className="text-center text-muted-foreground py-8">Nenhuma visualização registrada</p>}
      </CardContent>
    </Card>
  );
}
