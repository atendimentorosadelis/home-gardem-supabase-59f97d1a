import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/layout/Layout";
import { PostCard } from "@/components/home/PostCard";
import { BlogFilters, SortOption } from "@/components/blog/BlogFilters";
import { BlogPagination } from "@/components/blog/BlogPagination";
import { useBlogArticles, useCategories } from "@/hooks/use-blog-articles";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileSearch,
  Sparkles,
  BookOpen,
  TrendingUp,
  Users,
  ArrowDown,
  Leaf,
  Home,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Blog() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const contentRef = useRef<HTMLDivElement>(null);

  // Get initial values from URL
  const initialSearch = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "all";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialSort = (searchParams.get("sort") as SortOption) || "recent";

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when category or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, sortBy]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (sortBy !== "recent") params.set("sort", sortBy);
    if (currentPage > 1) params.set("page", currentPage.toString());
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedCategory, sortBy, currentPage, setSearchParams]);

  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();
  const { data, isLoading, isError } = useBlogArticles({
    search: debouncedSearch,
    category: selectedCategory,
    page: currentPage,
    perPage: 9,
    sortBy,
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedCategory("all");
    setSortBy("recent");
    setCurrentPage(1);
  };

  const handleSubNicheClick = (niche: string) => {
    setSearch(niche);
  };

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Stats for the hero
  const totalArticles = data?.totalPosts || 0;

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[50vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden pt-16 md:pt-20">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5">
          {/* Floating elements - hidden on mobile for performance */}
          <div className="hidden md:block absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="hidden md:block absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-gradient-to-r from-primary/5 to-accent/5 rounded-full blur-3xl" />

          {/* Decorative icons floating - hidden on mobile */}
          <div className="hidden md:block absolute top-32 left-[10%] animate-float opacity-20">
            <Leaf className="h-12 w-12 text-primary" />
          </div>
          <div className="hidden md:block absolute top-48 right-[15%] animate-float opacity-20" style={{ animationDelay: '0.5s' }}>
            <Home className="h-10 w-10 text-primary" />
          </div>
          <div className="hidden md:block absolute bottom-40 left-[20%] animate-float opacity-20" style={{ animationDelay: '1s' }}>
            <Palette className="h-8 w-8 text-primary" />
          </div>
          <div className="hidden md:block absolute bottom-32 right-[25%] animate-float opacity-20" style={{ animationDelay: '1.5s' }}>
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] md:bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />

        <div className="container relative z-10 mx-auto px-4 md:px-6 lg:px-12">
          <div className="max-w-4xl mx-auto text-center space-y-4 md:space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-primary/10 border border-primary/20 rounded-full animate-fade-in">
              <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
              <span className="text-xs md:text-sm font-medium text-primary">
                {t("blog.badge", "Explore Nosso Conteúdo")}
              </span>
            </div>

            {/* Title with gradient */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <span className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                {t("blog.title")}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in px-2" style={{ animationDelay: '0.2s' }}>
              {t("blog.subtitle")}
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 pt-4 md:pt-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-lg md:text-2xl font-bold text-foreground">{totalArticles}+</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">{t("blog.articlesLabel", "Artigos")}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-accent/50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-accent-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-lg md:text-2xl font-bold text-foreground">{categories.length - 1}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">{t("blog.categoriesLabel", "Categorias")}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-secondary flex items-center justify-center">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-secondary-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-lg md:text-2xl font-bold text-foreground">10K+</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">{t("blog.readersLabel", "Leitores")}</p>
                </div>
              </div>
            </div>

            {/* Scroll indicator */}
            <button
              onClick={scrollToContent}
              className="inline-flex flex-col items-center gap-1.5 md:gap-2 pt-4 md:pt-8 animate-fade-in group"
              style={{ animationDelay: '0.4s' }}
            >
              <span className="text-xs md:text-sm text-muted-foreground group-hover:text-primary transition-colors">
                {t("blog.scrollToExplore", "Explorar artigos")}
              </span>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-primary/30 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-all">
                <ArrowDown className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary animate-bounce" />
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section ref={contentRef} className="py-10 md:py-20 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4 md:px-6 lg:px-12">
          {/* Filters */}
          <div className="mb-8 md:mb-12 animate-fade-in">
            <BlogFilters
              search={search}
              onSearchChange={setSearch}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              categories={categories}
              isLoadingCategories={isLoadingCategories}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onSubNicheClick={handleSubNicheClick}
            />
          </div>

          {/* Content */}
          {isLoading ? (
            // Loading skeleton
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="space-y-4 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                  <Skeleton className="aspect-[4/3] rounded-2xl" />
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            // Error state
            <div className="text-center py-20 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <FileSearch className="h-10 w-10 text-destructive" />
              </div>
              <p className="text-destructive text-lg font-semibold">
                {t("blog.errorTitle")}
              </p>
              <p className="text-muted-foreground">
                {t("blog.errorDesc")}
              </p>
            </div>
          ) : data?.posts.length === 0 ? (
            // Empty state
            <div className="text-center py-20 space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center">
                <FileSearch className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  {t("blog.noResults")}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {t("blog.noResultsDesc")}
                </p>
              </div>
              {(search || selectedCategory !== "all") && (
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/25"
                >
                  {t("blog.clearFilters")}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Results count */}
              <div className="mb-8 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {data?.totalPosts === 1
                    ? t("blog.resultsCountOne", { count: 1 })
                    : t("blog.resultsCount", { count: data?.totalPosts })}
                </p>
                {currentPage > 1 && (
                  <p className="text-sm text-muted-foreground">
                    Página {currentPage} de {data?.totalPages}
                  </p>
                )}
              </div>

              {/* Posts Grid with staggered animation */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {data?.posts.map((post, index) => (
                  <div
                    key={post.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <PostCard post={post} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <BlogPagination
                currentPage={data?.currentPage || 1}
                totalPages={data?.totalPages || 1}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-12 md:py-20 bg-gradient-to-t from-primary/5 to-transparent">
        <div className="container mx-auto px-4 md:px-6 lg:px-12">
          <div className="max-w-3xl mx-auto text-center space-y-4 md:space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              {t("blog.ctaTitle", "Não encontrou o que procura?")}
            </h2>
            <p className="text-muted-foreground text-sm md:text-lg px-2">
              {t("blog.ctaDescription", "Explore todas as nossas categorias ou entre em contato para sugestões de novos conteúdos.")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 md:pt-4">
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSearch("");
                  scrollToContent();
                }}
                className="px-5 md:px-6 py-2.5 md:py-3 bg-primary text-primary-foreground rounded-full font-medium text-sm md:text-base hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/25"
              >
                {t("blog.viewAllArticles", "Ver Todos os Artigos")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Custom animation styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </Layout>
  );
}
