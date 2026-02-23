import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Post } from "@/components/home/PostCard";
import { formatDate, getCurrentLocale } from "@/utils/formatDate";
import { PARENT_CATEGORY_SLUGS } from "@/data/blog-categories";

export type SortOption = "recent" | "popular" | "az" | "za";

interface UseBlogArticlesOptions {
  search?: string;
  category?: string;
  page?: number;
  perPage?: number;
  sortBy?: SortOption;
}

interface DatabaseArticle {
  id: string;
  title: string;
  body: string | null;
  slug: string | null;
  cover_image: string | null;
  excerpt: string | null;
  category: string | null;
  category_slug: string | null;
  published_at: string | null;
  read_time: string | null;
  likes_count: number;
}

interface PostWithDate extends Post {
  publishedAt?: Date;
  viewsCount?: number;
}

function mapArticleToPost(article: DatabaseArticle): PostWithDate {
  return {
    id: article.slug || article.id,
    uuid: article.id,
    title: article.title,
    excerpt: article.excerpt || "",
    category: article.category || "Jardim",
    categorySlug: article.category_slug || "jardim",
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
    case "recent":
      return sorted.sort((a, b) => {
        const dateA = a.publishedAt || new Date(0);
        const dateB = b.publishedAt || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
    case "popular":
      return sorted.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    case "az":
      return sorted.sort((a, b) => a.title.localeCompare(b.title, locale));
    case "za":
      return sorted.sort((a, b) => b.title.localeCompare(a.title, locale));
    default:
      return sorted;
  }
}

export function useBlogArticles(options: UseBlogArticlesOptions = {}) {
  const { search = "", category = "all", page = 1, perPage = 9, sortBy = "recent" } = options;

  return useQuery({
    queryKey: ["blog-articles", search, category, page, perPage, sortBy],
    queryFn: async () => {
      const { data: dbArticles, error } = await supabase
        .from("content_articles")
        .select("*")
        .eq("status", "published")
        .not("published_at", "is", null)
        .not("cover_image", "is", null)
        .order("published_at", { ascending: false });

      if (error) {
        console.error("Error fetching articles:", error);
        throw error;
      }

      // Fetch views count for all articles
      const { data: viewsData } = await supabase
        .from("article_views")
        .select("article_id");

      const viewsCount: Record<string, number> = {};
      viewsData?.forEach(view => {
        viewsCount[view.article_id] = (viewsCount[view.article_id] || 0) + 1;
      });

      // Map database articles to Post format
      const allPosts: PostWithDate[] = (dbArticles || []).map(article => ({
        ...mapArticleToPost(article),
        viewsCount: viewsCount[article.id] || 0,
      }));

      // Apply category filter (support parent categories)
      const parentSlugs = PARENT_CATEGORY_SLUGS[category];
      const filteredByCategory =
        category === "all"
          ? allPosts
          : parentSlugs
            ? allPosts.filter((post) =>
                parentSlugs.includes(post.categorySlug?.toLowerCase() || "")
              )
            : allPosts.filter(
                (post) =>
                  post.categorySlug?.toLowerCase() === category.toLowerCase()
              );

      // Apply search filter
      const normalizeText = (text: string) =>
        text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

      const searchNormalized = normalizeText(search);
      const searchWords = searchNormalized.split(/\s+/).filter(w => w.length > 2);

      const filteredPosts = search.trim()
        ? filteredByCategory.filter((post) => {
            const titleNormalized = normalizeText(post.title);
            const excerptNormalized = normalizeText(post.excerpt);
            const categoryNormalized = normalizeText(post.category);

            return searchWords.some(word =>
              titleNormalized.includes(word) ||
              excerptNormalized.includes(word) ||
              categoryNormalized.includes(word)
            ) ||
            titleNormalized.includes(searchNormalized) ||
            excerptNormalized.includes(searchNormalized) ||
            categoryNormalized.includes(searchNormalized);
          })
        : filteredByCategory;

      // Apply sorting
      const sortedPosts = sortPosts(filteredPosts, sortBy);

      // Calculate pagination
      const totalPosts = sortedPosts.length;
      const totalPages = Math.ceil(totalPosts / perPage);
      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage;
      const paginatedPosts = sortedPosts.slice(startIndex, endIndex);

      return {
        posts: paginatedPosts,
        totalPosts,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    },
  });
}

// Get unique categories from database articles only
export function useCategories() {
  return useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data: dbArticles } = await supabase
        .from("content_articles")
        .select("category, category_slug")
        .eq("status", "published")
        .not("published_at", "is", null);

      const dbCategories = (dbArticles || []).map((a) => ({
        name: a.category || "Jardim",
        slug: a.category_slug || "jardim",
      }));

      const uniqueCategories = dbCategories.filter(
        (cat, index, self) =>
          index === self.findIndex((c) => c.slug === cat.slug)
      );

      const sorted = uniqueCategories.sort((a, b) =>
        a.slug.localeCompare(b.slug)
      );

      return [{ name: "Todos", slug: "all" }, ...sorted];
    },
  });
}
