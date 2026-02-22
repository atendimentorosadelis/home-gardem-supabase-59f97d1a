import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

export type SortOption = "recent" | "popular" | "az" | "za";

interface Category {
  name: string;
  slug: string;
}

interface BlogFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: Category[];
  isLoadingCategories: boolean;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onSubNicheClick?: (niche: string) => void;
}

export function BlogFilters({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  isLoadingCategories,
  sortBy,
  onSortChange,
}: BlogFiltersProps) {
  const { t } = useTranslation();

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "recent", label: t("blog.sortRecent", "Mais Recentes") },
    { value: "popular", label: t("blog.sortPopular", "Mais Populares") },
    { value: "az", label: "A-Z" },
    { value: "za", label: "Z-A" },
  ];

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("blog.searchPlaceholder", "Buscar artigos...")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-12 rounded-xl"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {!isLoadingCategories &&
          categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => onCategoryChange(cat.slug)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.slug
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {cat.name}
            </button>
          ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("blog.sortBy", "Ordenar por")}:</span>
        <div className="flex gap-1">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sortBy === option.value
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
