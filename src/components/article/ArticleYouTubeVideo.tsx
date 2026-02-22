import { useArticleVideo } from '@/hooks/use-article-videos';
import { Skeleton } from '@/components/ui/skeleton';
import { Youtube, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ArticleYouTubeVideoProps {
  articleId: string | undefined;
}

export function ArticleYouTubeVideo({ articleId }: ArticleYouTubeVideoProps) {
  const { video, isLoading } = useArticleVideo(articleId);
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="my-8 sm:my-12">
        <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-card/50 p-1">
          <Skeleton className="w-full aspect-video rounded-lg sm:rounded-xl" />
        </div>
      </div>
    );
  }

  if (!video) {
    return null;
  }

  return (
    <div className="my-8 sm:my-12 animate-fade-in">
      <div className="group relative">
        <div className="hidden sm:block absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/20 via-emerald-500/30 to-primary/20 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-700 animate-subtle-glow" />
        <div className={cn(
          "relative overflow-hidden rounded-xl sm:rounded-2xl",
          "bg-gradient-to-br from-card via-card to-accent/10",
          "border border-border/50",
          "shadow-lg sm:shadow-xl shadow-primary/5",
          "sm:group-hover:shadow-2xl sm:group-hover:shadow-primary/15",
          "sm:group-hover:border-primary/40",
          "transition-all duration-500"
        )}>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="relative px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-border/30">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={cn(
                "flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl",
                "bg-gradient-to-br from-destructive/20 to-destructive/5",
                "border border-destructive/20",
                "sm:group-hover:scale-110 sm:group-hover:rotate-3",
                "transition-transform duration-500"
              )}>
                <Youtube className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                  {t('article.relatedVideo', 'Vídeo Relacionado')}
                </h3>
                <p className="hidden sm:block text-xs text-muted-foreground">
                  Conteúdo complementar em vídeo
                </p>
              </div>
            </div>
          </div>
          <div className="p-2 sm:p-4 md:p-6">
            <div className={cn(
              "relative overflow-hidden rounded-lg sm:rounded-xl",
              "ring-1 ring-border/30",
              "shadow-xl sm:shadow-2xl shadow-black/30",
              "sm:group-hover:ring-primary/30",
              "transition-all duration-500"
            )}>
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtube_video_id}?rel=0&modestbranding=1`}
                  title={video.video_title || 'Vídeo relacionado'}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          </div>
          {video.video_title && (
            <div className="px-3 sm:px-6 pb-3 sm:pb-5 pt-0">
              <div className={cn(
                "flex items-start gap-2 sm:gap-3 p-2.5 sm:p-4 rounded-lg sm:rounded-xl",
                "bg-gradient-to-r from-accent/50 via-accent/30 to-transparent",
                "border border-border/30"
              )}>
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-primary/10 flex items-center justify-center">
                  <Play className="h-3 w-3 sm:h-4 sm:w-4 text-primary fill-primary/30" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Reproduzindo</p>
                  <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-2 leading-snug">
                    {video.video_title}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
      </div>
    </div>
  );
}
