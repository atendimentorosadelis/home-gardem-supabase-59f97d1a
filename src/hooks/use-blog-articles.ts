import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Post } from "@/components/home/PostCard";
import { formatDate, getCurrentLocale } from "@/utils/formatDate";

export type SortOption = "recent" | "popular" | "az" | "za";

interface UseBlogArticlesOptions {
  search?: string;
  category?: string;
  page?: number;
  perPage?: number;
  sortBy?: SortOption;
}

interface PostWithDate extends Post {
  publishedAt?: Date;
  viewsCount?: number;
}

function mapArticleToPost(article: any): PostWithDate {
  return {
    id: article.slug || article.id,
    uuid: article.id,
    title: article.title,
    excerpt: article.excerpt || "",
    category: article.category || "Decoração",
    categorySlug: article.category_slug || "decoracao",
    image: article.cover_image || "/placeholder.svg",
    date: formatDate(article.published_at),
    readTime: article.read_time || "5 min",
    likesCount: article.likes_count || 0,
    publishedAt: article.published_at ? new Date(article.published_at) : undefined,
  };
}

function sortPosts(posts: PostWithDate[], sortBy: SortOption): PostWithDate[] {
  const sorted = [...posts];
  const locale = getCurrentLocale();
  switch (sortBy) {
    case "recent": return sorted.sort((a, b) => (b.publishedAt || new Date(0)).getTime() - (a.publishedAt || new Date(0)).getTime());
    case "popular": return sorted.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    case "az": return sorted.sort((a, b) => a.title.localeCompare(b.title, locale));
    case "za": return sorted.sort((a, b) => b.title.localeCompare(a.title, locale));
    default: return sorted;
  }
}

export function useBlogArticles(options: UseBlogArticlesOptions = {}) {
  const { search = "", category = "all", page = 1, perPage = 9, sortBy = "recent" } = options;

  return useQuery({
    queryKey: ["blog-articles", search, category, page, perPage, sortBy],
    queryFn: async () => {
      const { data: dbArticles, error } = await (supabase as any).from("content_articles").select("*").eq("status", "published").not("published_at", "is", null).order("published_at", { ascending: false });
      if (error) throw error;

      const { data: viewsData } = await (supabase as any).from("article_views").select("article_id");
      const viewsCount: Record<string, number> = {};
      (viewsData || []).forEach((view: any) => { viewsCount[view.article_id] = (viewsCount[view.article_id] || 0) + 1; });

      const allPosts: PostWithDate[] = (dbArticles || []).map((article: any) => ({ ...mapArticleToPost(article), viewsCount: viewsCount[article.id] || 0 }));

      const filteredByCategory = category === "all" ? allPosts : allPosts.filter(post => post.categorySlug?.toLowerCase() === category.toLowerCase());

      const normalizeText = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const searchNormalized = normalizeText(search);
      const searchWords = searchNormalized.split(/\s+/).filter(w => w.length > 2);

      const filteredPosts = search.trim()
        ? filteredByCategory.filter(post => {
            const t = normalizeText(post.title), e = normalizeText(post.excerpt), c = normalizeText(post.category);
            return searchWords.some(w => t.includes(w) || e.includes(w) || c.includes(w)) || t.includes(searchNormalized) || e.includes(searchNormalized) || c.includes(searchNormalized);
          })
        : filteredByCategory;

      const sortedPosts = sortPosts(filteredPosts, sortBy);
      const totalPosts = sortedPosts.length;
      const totalPages = Math.ceil(totalPosts / perPage);
      const paginatedPosts = sortedPosts.slice((page - 1) * perPage, page * perPage);

      return { posts: paginatedPosts, totalPosts, totalPages, currentPage: page, hasNextPage: page < totalPages, hasPrevPage: page > 1 };
    },
  });
}

// Default categories to show when database has no published articles
const defaultCategories = [
  { name: "Arquitetura", slug: "arquitetura" },
  { name: "Decoração", slug: "decoracao" },
  { name: "Design Interno", slug: "design-interno" },
  { name: "Jardim", slug: "jardim" },
];

export function useCategories() {
  return useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data: dbArticles } = await (supabase as any).from("content_articles").select("category, category_slug").eq("status", "published").not("published_at", "is", null);
      const dbCategories = (dbArticles || []).map((a: any) => ({ name: a.category || "Decoração", slug: a.category_slug || "decoracao" }));
      const uniqueCategories = dbCategories.filter((cat: any, index: number, self: any[]) => index === self.findIndex(c => c.slug === cat.slug));
      const sorted = uniqueCategories.sort((a: any, b: any) => a.slug.localeCompare(b.slug));
      
      // Use default categories as fallback if no categories found in database
      const categories = sorted.length > 0 ? sorted : defaultCategories;
      return [{ name: "Todos", slug: "all" }, ...categories];
    },
  });
}
