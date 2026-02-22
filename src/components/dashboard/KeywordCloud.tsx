import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface KeywordCloudProps {
  keywords: { keyword: string; count: number }[];
  isLoading: boolean;
}

export function KeywordCloud({ keywords, isLoading }: KeywordCloudProps) {
  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...keywords.map(k => k.count), 1);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Keywords Populares</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => {
            const opacity = 0.4 + (kw.count / maxCount) * 0.6;
            return (
              <span
                key={kw.keyword}
                className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                style={{ opacity }}
              >
                {kw.keyword} ({kw.count})
              </span>
            );
          })}
          {keywords.length === 0 && (
            <p className="text-muted-foreground text-sm">Nenhuma keyword encontrada</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
