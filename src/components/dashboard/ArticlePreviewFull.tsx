import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Clock, Tag } from 'lucide-react';
import type { GeneratedArticle } from '@/hooks/use-full-article-generation';

interface ArticlePreviewFullProps {
  article: GeneratedArticle;
}

export function ArticlePreviewFull({ article }: ArticlePreviewFullProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{article.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{article.category}</Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />{article.readTime}
            </Badge>
          </div>
        </div>
        {article.excerpt && (
          <p className="text-muted-foreground mt-2 italic">{article.excerpt}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cover Image */}
        {article.coverImage && (
          <div className="rounded-xl overflow-hidden">
            <img src={article.coverImage} alt={article.title} className="w-full h-auto object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br/>') }} />

        {/* Gallery */}
        {article.galleryImages.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Galeria</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {article.galleryImages.map((img, i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-border/50">
                  <img src={img} alt={`Galeria ${i + 1}`} className="w-full h-40 object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {article.tags.map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        {/* External Links */}
        {article.externalLinks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Links Externos</h4>
            {article.externalLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <ExternalLink className="h-3 w-3" />{link.text}
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
