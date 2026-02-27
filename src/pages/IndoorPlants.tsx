import { Layout } from "@/components/layout/Layout";
import { PostsGrid } from "@/components/home/PostsGrid";
import { usePublishedArticles } from "@/hooks/use-published-articles";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

const IndoorPlants = () => {
  const { t } = useTranslation();
  const { data: articles = [], isLoading } = usePublishedArticles();
  const posts = articles.filter(post => post.categorySlug === "plantas-internas");

  return (
    <Layout>
      <section className="pt-16 pb-8">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-2xl space-y-4">
            <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground">{t('categoryPages.category')}</p>
            <h1 className="text-4xl md:text-5xl font-display font-medium text-foreground">{t('categoryPages.indoorPlantsTitle')}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t('categoryPages.indoorPlantsDesc')}
            </p>
          </div>
        </div>
      </section>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : posts.length > 0 ? (
        <PostsGrid posts={posts} />
      ) : (
        <div className="container mx-auto px-6 lg:px-12 py-12 text-center">
          <p className="text-muted-foreground">{t('categoryPages.noArticles')}</p>
        </div>
      )}
    </Layout>
  );
};

export default IndoorPlants;
