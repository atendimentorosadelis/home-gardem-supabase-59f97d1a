import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface SEOOverviewProps {
  overallScore: number;
  criteriaPercentages: {
    keywords: number;
    excerpt: number;
    coverImage: number;
    content: number;
  };
  isLoading: boolean;
}

export function SEOOverview({ overallScore, criteriaPercentages, isLoading }: SEOOverviewProps) {
  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const criteria = [
    { label: 'Keywords', value: criteriaPercentages.keywords },
    { label: 'Excerpt', value: criteriaPercentages.excerpt },
    { label: 'Imagem', value: criteriaPercentages.coverImage },
    { label: 'Conteúdo', value: criteriaPercentages.content },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Score SEO Geral</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <span className="text-4xl font-bold text-primary">{overallScore}</span>
          <span className="text-muted-foreground">/100</span>
        </div>
        <div className="space-y-3">
          {criteria.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.value}%</span>
              </div>
              <Progress value={item.value} className="h-1.5" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
