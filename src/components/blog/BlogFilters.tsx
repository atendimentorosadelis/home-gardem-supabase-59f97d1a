import { Search, X, LayoutGrid, Home, Leaf, Building2, Hammer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_SUB_NICHES } from "@/data/blog-categories";

export type SortOption = "recent" | "popular" | "az" | "za";

interface BlogFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onSubNicheClick?: (niche: string) => void;
}

const parentCategoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'all': LayoutGrid,
  'design-interno': Home,
  'jardim': Leaf,
  'arquitetura': Building2,
  'carpintaria': Hammer,
};

export function BlogFilters({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  onSubNicheClick,
}: BlogFiltersProps) {
  const { t } = useTranslation();

  const parentLabels: Record<string, string> = {
    'all': t("blog.allCategories", "Todos"),
    'design-interno': "Design Interno",
    'jardim': "Jardim",
    'arquitetura': "Arquitetura",
    'carpintaria': "Carpintaria",
  };

  const parentKeys = ['all', 'design-interno', 'jardim', 'arquitetura', 'carpintaria'];

  return (
    <div className="space-y-8">
      {/* Search Bar & Themes Dropdown */}
      <div className="flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto">
        <div className="relative flex-1 group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            type="text"
            placeholder={t("blog.searchPlaceholder")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="relative pl-14 pr-12 h-14 rounded-full bg-card border-2 border-border/50 focus:border-primary focus:ring-4 focus:ring-primary/10 text-base shadow-lg shadow-black/5 transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-2 hover:bg-destructive/10 rounded-full transition-colors group/clear"
            >
              <X className="h-4 w-4 text-muted-foreground group-hover/clear:text-destructive transition-colors" />
            </button>
          )}
        </div>

        {/* Themes Dropdown */}
        <Select
          value="all"
          onValueChange={(val) => {
            if (val === "all") {
              onSearchChange("");
            } else {
              onSubNicheClick?.(val);
            }
          }}
        >
          <SelectTrigger className="w-full sm:w-64 h-14 rounded-full bg-card border-2 border-border/50 hover:border-primary/50 shadow-lg shadow-black/5 transition-all">
            <LayoutGrid className="h-4 w-4 mr-2 text-primary" />
            <SelectValue placeholder={t("blog.allThemes", "Todos os Temas")} />
          </SelectTrigger>
          <SelectContent className="max-h-80 bg-popover border-2 border-border shadow-2xl z-50 rounded-2xl" side="bottom" align="center" sideOffset={8} avoidCollisions={false}>
            <SelectGroup>
              <SelectItem value="all" className="rounded-xl">
                <div className="flex items-center gap-3 py-1">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <LayoutGrid className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">{t("blog.allThemes", "Todos os Temas")}</span>
                </div>
              </SelectItem>
              {ALL_SUB_NICHES.map((niche) => {
                const NicheIcon = niche.icon;
                return (
                  <SelectItem key={niche.name} value={niche.name} className="rounded-xl">
                    <div className="flex items-center gap-3 py-1">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                        <NicheIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span>{niche.name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Parent Category Filters - Only 4 buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        {parentKeys.map((key) => {
          const Icon = parentCategoryIcons[key];
          const isSelected = selectedCategory === key;
          return (
            <button
              key={key}
              onClick={() => onCategoryChange(key)}
              className={cn(
                "relative inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-full transition-all duration-300 group overflow-hidden",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-xl shadow-primary/30"
                  : "bg-card border-2 border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground hover:shadow-lg"
              )}
            >
              {!isSelected && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              <Icon className={cn(
                "h-4 w-4 relative z-10 transition-transform group-hover:scale-110",
                isSelected && "drop-shadow-md"
              )} />
              <span className="whitespace-nowrap relative z-10">{parentLabels[key]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
