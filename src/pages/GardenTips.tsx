import { Layout } from "@/components/layout/Layout";
import { PostsGrid } from "@/components/home/PostsGrid";
import { usePublishedArticles } from "@/hooks/use-published-articles";
import { Loader2 } from "lucide-react";

const GardenTips = () => {
  const { data: articles = [], isLoading } = usePublishedArticles();
  const posts = articles.filter(post => post.categorySlug === "jardim");

  return (
    <Layout>
      <section className="pt-16 pb-8">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-2xl space-y-4">
            <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground">Categoria</p>
            <h1 className="text-4xl md:text-5xl font-display font-medium text-foreground">Dicas de Jardim</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Conselhos práticos e insights de especialistas para ajudar seu jardim a prosperar em todas as estações.
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
          <p className="text-muted-foreground">Nenhum artigo encontrado nesta categoria.</p>
        </div>
      )}
    </Layout>
  );
};

export default GardenTips;
