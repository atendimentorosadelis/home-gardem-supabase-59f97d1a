import { Search, X, Palette, Home, Leaf, Building2, Trees, Hammer, Recycle, Sofa, TrendingUp, Lightbulb, CalendarHeart, LayoutGrid, Clock, Heart, SortAsc, SortDesc, Armchair, UtensilsCrossed, Bed, Bath, Laptop, ChefHat, Waves, TreeDeciduous, Flower2, Mountain, Fence, Sprout, Castle, Landmark, Factory, HomeIcon, Boxes, PaintBucket, Sparkles, Wrench, PackageOpen, Sun, Zap, Moon, Ghost, Gift, PartyPopper, TreePine, Egg, HeartHandshake } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  name: string;
  slug: string;
}

export type SortOption = "recent" | "popular" | "az" | "za";

interface BlogFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: Category[];
  isLoadingCategories?: boolean;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onSubNicheClick?: (niche: string) => void;
}

// Category icons mapping
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'all': LayoutGrid,
  'decoracao': Palette,
  'design-interno': Home,
  'jardim': Leaf,
  'arquitetura': Building2,
  'plantas-de-interior': Trees,
  'diy-e-projetos': Hammer,
  'sustentabilidade': Recycle,
  'moveis-e-organizacao': Sofa,
  'tendencias': TrendingUp,
  'iluminacao': Lightbulb,
  'datas-comemorativas': CalendarHeart,
};

// All sub-niches/themes as a flat list
interface SubNiche {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const allSubNiches: SubNiche[] = [
  // Design Interno - Áreas Sociais
  { name: 'Sala de Estar', icon: Armchair },
  { name: 'Sala de Jantar', icon: UtensilsCrossed },
  { name: 'Lareira', icon: Home },
  { name: 'Área Gourmet', icon: ChefHat },
  { name: 'Varanda', icon: Sun },
  // Design Interno - Áreas Íntimas
  { name: 'Quarto', icon: Bed },
  { name: 'Banheiro', icon: Bath },
  { name: 'Closet', icon: PackageOpen },
  { name: 'Escritório', icon: Laptop },
  { name: 'Home Office', icon: Laptop },
  // Design Interno - Áreas de Serviço
  { name: 'Cozinha', icon: UtensilsCrossed },
  { name: 'Área de Serviço', icon: Wrench },
  { name: 'Lavanderia', icon: Waves },
  { name: 'Piscina', icon: Waves },
  // Jardim
  { name: 'Jardim', icon: Leaf },
  { name: 'Jardim Vertical', icon: Fence },
  { name: 'Suculentas', icon: Sprout },
  { name: 'Paisagismo', icon: Mountain },
  { name: 'Horta Urbana', icon: Leaf },
  { name: 'Flores', icon: Flower2 },
  { name: 'Gramados', icon: TreeDeciduous },
  { name: 'Dicas de Decoração Jardim', icon: Palette },
  { name: 'Cuidados com Plantação', icon: Sprout },
  { name: 'Halloween', icon: Ghost },
  // Plantas de Interior
  { name: 'Folhagens', icon: Leaf },
  { name: 'Orquídeas', icon: Flower2 },
  { name: 'Cactos', icon: Sprout },
  { name: 'Palmeiras', icon: Trees },
  { name: 'Plantas Pendentes', icon: TreeDeciduous },
  // Arquitetura
  { name: 'Arquitetura Moderna', icon: HomeIcon },
  { name: 'Arquitetura Colonial', icon: Castle },
  { name: 'Arquitetura Contemporânea', icon: Building2 },
  { name: 'Arquitetura Sustentável', icon: Recycle },
  { name: 'Arquitetura Minimalista', icon: Boxes },
  // Decoração - Estilos
  { name: 'Minimalista', icon: Boxes },
  { name: 'Rústico', icon: TreeDeciduous },
  { name: 'Moderno', icon: Sparkles },
  { name: 'Clássico', icon: Landmark },
  { name: 'Boho', icon: Flower2 },
  { name: 'Industrial', icon: Factory },
  // DIY e Projetos
  { name: 'Móveis DIY', icon: Sofa },
  { name: 'Decoração DIY', icon: PaintBucket },
  { name: 'Reforma', icon: Wrench },
  { name: 'Organização', icon: Boxes },
  { name: 'Reciclagem', icon: Recycle },
  // Sustentabilidade
  { name: 'Energia Solar', icon: Sun },
  { name: 'Compostagem', icon: Sprout },
  { name: 'Reuso de Água', icon: Waves },
  { name: 'Materiais Eco', icon: Leaf },
  // Tendências
  { name: 'Tendências 2026', icon: Sparkles },
  { name: 'Cores do Ano', icon: Palette },
  { name: 'Materiais em Alta', icon: Boxes },
  { name: 'Estilos Emergentes', icon: TrendingUp },
  // Iluminação
  { name: 'Iluminação Natural', icon: Sun },
  { name: 'Iluminação LED', icon: Lightbulb },
  { name: 'Iluminação Decorativa', icon: Sparkles },
  { name: 'Iluminação Funcional', icon: Zap },
  { name: 'Automação', icon: Moon },
  // Datas Comemorativas
  { name: 'Natal', icon: TreePine },
  { name: 'Páscoa', icon: Egg },
  { name: 'Halloween', icon: Ghost },
  { name: 'Dia das Mães', icon: HeartHandshake },
  { name: 'Festas', icon: PartyPopper },
];

export function BlogFilters({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  isLoadingCategories,
  sortBy,
  onSortChange,
  onSubNicheClick,
}: BlogFiltersProps) {
  const { t } = useTranslation();

  // Get translated category name
  const getCategoryName = (slug: string): string => {
    if (slug === "all") return t("blog.allCategories");
    const key = `categories.${slug}`;
    const translated = t(key);
    return translated !== key ? translated : t('categories.default');
  };

  // Get icon for category
  const getCategoryIcon = (slug: string) => {
    return categoryIcons[slug] || LayoutGrid;
  };

  return (
    <div className="space-y-8">
      {/* Search Bar & Sort */}
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
              {allSubNiches.map((niche) => {
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

      {/* Category Filters - Horizontal Pills */}
      <div className="relative -mx-6 px-6 md:mx-0 md:px-0">
        {/* Gradient fade left */}
        <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none md:hidden z-10" />

        <div className="flex md:flex-wrap md:justify-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide snap-x snap-mandatory">
          {isLoadingCategories ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-32 rounded-full flex-shrink-0" />
            ))
          ) : (
            categories.map((category) => {
              const Icon = getCategoryIcon(category.slug);
              const isSelected = selectedCategory === category.slug;
              return (
                <button
                  key={category.slug}
                  onClick={() => onCategoryChange(category.slug)}
                  className={cn(
                    "relative inline-flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-full transition-all duration-300 flex-shrink-0 snap-start group overflow-hidden",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xl shadow-primary/30"
                      : "bg-card border-2 border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground hover:shadow-lg"
                  )}
                >
                  {/* Hover glow effect */}
                  {!isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <Icon className={cn(
                    "h-4 w-4 relative z-10 transition-transform group-hover:scale-110",
                    isSelected && "drop-shadow-md"
                  )} />
                  <span className="whitespace-nowrap relative z-10">{getCategoryName(category.slug)}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Gradient fade right */}
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden z-10" />
      </div>
    </div>
  );
}
