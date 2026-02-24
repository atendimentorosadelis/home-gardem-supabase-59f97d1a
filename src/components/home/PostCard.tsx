import { Link } from "react-router-dom";
import { ArrowRight, Heart, Eye, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useArticleLikes } from "@/hooks/use-article-likes";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useTranslatedPreview } from "@/hooks/use-translated-content";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useConfetti } from "@/hooks/use-confetti";
import { useLikeSound } from "@/hooks/use-like-sound";

export interface Post {
  id: string;
  uuid?: string;
  title: string;
  excerpt: string;
  category: string;
  categorySlug: string;
  image: string;
  date: string;
  readTime: string;
  content?: string;
  author?: string;
  authorImage?: string;
  tags?: string[];
  likesCount?: number;
  viewsCount?: number;
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { t, i18n } = useTranslation();
  const { likeArticle, hasLiked, isLiking } = useArticleLikes();
  const { fireConfetti } = useConfetti();
  const { playLikeSound } = useLikeSound();
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isLiked, setIsLiked] = useState(false);

  const { translatedTitle, translatedExcerpt, isTranslating } = useTranslatedPreview({
    title: post.title, excerpt: post.excerpt, slug: post.id,
    enabled: i18n.language !== 'pt-BR' && i18n.language !== 'pt',
  });

  const getCategoryName = (slug: string): string => {
    const key = `categories.${slug}`;
    const translated = t(key);
    return translated !== key ? translated : post.category;
  };

  const likeId = post.uuid || post.id;

  useEffect(() => { setIsLiked(hasLiked(likeId)); }, [likeId]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiked || isLiking === likeId) return;

    fireConfetti();
    playLikeSound();
    setLikesCount((prev) => prev + 1);
    setIsLiked(true);

    const newCount = await likeArticle(likeId);
    if (newCount !== null) { setLikesCount(newCount); }
    else { setLikesCount((prev) => prev - 1); setIsLiked(false); }
  };

  return (
    <article className="group cursor-pointer">
      <Link to={`/${post.categorySlug}/${post.id}`} className="block space-y-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-card border-2 border-border/50 group-hover:border-primary/50 transition-all duration-500 shadow-lg shadow-black/5 group-hover:shadow-xl group-hover:shadow-primary/10">
          <img src={post.image} alt={post.title} width={600} height={450} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
          <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <span className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-lg">{getCategoryName(post.categorySlug)}</span>
          </div>
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <ArrowRight className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        </div>

        <div className="space-y-3 px-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-accent/50 text-accent-foreground text-xs font-semibold rounded-full">{getCategoryName(post.categorySlug)}</span>
              <span className="text-xs text-muted-foreground">{post.date}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/50">
                <Eye size={14} className="text-muted-foreground" />
                <AnimatedCounter value={post.viewsCount || 0} duration={600} className="text-xs font-medium text-muted-foreground" />
              </div>
              <button
                onClick={handleLike}
                disabled={isLiked || isLiking === likeId}
                className={cn("flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-300 hover:scale-110", isLiked ? "bg-destructive/10" : "bg-secondary/50 hover:bg-destructive/10")}
              >
                <Heart size={14} className={cn("transition-all duration-300", isLiked ? "text-destructive fill-destructive" : "text-muted-foreground hover:text-destructive")} />
                <AnimatedCounter value={likesCount} duration={600} className={cn("text-xs font-medium", isLiked ? "text-destructive" : "text-muted-foreground")} />
              </button>
            </div>
          </div>

          <h3 className="text-lg font-bold leading-snug text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-2">
            {isTranslating ? <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" />{post.title}</span> : translatedTitle}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{isTranslating ? post.excerpt : translatedExcerpt}</p>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all duration-300 pt-1">
            <span>{t('common.readMore')}</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </article>
  );
}
