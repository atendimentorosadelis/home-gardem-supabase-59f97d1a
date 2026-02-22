import { useTranslation } from "react-i18next";
import { PostCard, Post } from "./PostCard";

interface PostsGridProps {
  posts: Post[];
  title?: string;
  subtitle?: string;
  useTranslatedTitles?: boolean;
}

export function PostsGrid({ posts, title, subtitle, useTranslatedTitles = false }: PostsGridProps) {
  const { t } = useTranslation();

  const displayTitle = useTranslatedTitles ? t("postsGrid.title") : title;
  const displaySubtitle = useTranslatedTitles ? t("postsGrid.subtitle") : subtitle;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6 lg:px-12">
        {(displayTitle || displaySubtitle) && (
          <div className="text-center mb-16 space-y-4">
            {displaySubtitle && <p className="text-sm font-semibold uppercase tracking-widest text-primary">{displaySubtitle}</p>}
            {displayTitle && <h2 className="text-3xl md:text-4xl font-bold text-foreground">{displayTitle}</h2>}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      </div>
    </section>
  );
}
