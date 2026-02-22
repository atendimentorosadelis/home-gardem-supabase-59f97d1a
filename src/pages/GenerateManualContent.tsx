import { useState, useEffect, useRef } from 'react';
import { 
  Loader2, 
  RefreshCw, 
  Save, 
  Send, 
  Home, 
  Leaf,
  Sofa,
  CookingPot,
  Bed,
  UtensilsCrossed,
  Flame,
  Bath,
  TreeDeciduous,
  Palette,
  Sprout,
  Briefcase,
  Sun,
  WashingMachine,
  Landmark,
  Castle,
  Factory,
  Building2,
  Mountain,
  Church,
  Snowflake,
  Columns3,
  X,
  ChefHat,
  Waves,
  Calendar,
  Layers,
  Flower2,
  Flower,
  TreePine,
  Droplets,
  Recycle,
  Sparkles,
  ArrowRight,
  Ghost,
  type LucideIcon
} from 'lucide-react';
import { AIIcon } from '@/components/AIIcon';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PermissionGate } from '@/components/PermissionGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { GenerationProgressHero } from '@/components/dashboard/GenerationProgressHero';
import { GenerationHistory } from '@/components/dashboard/GenerationHistory';
import { ArticlePreviewFull } from '@/components/dashboard/ArticlePreviewFull';
import { ImageApprovalPreview } from '@/components/dashboard/ImageApprovalPreview';
import { CommemorativeDateAlert } from '@/components/dashboard/CommemorativeDateAlert';
import { useFullArticleGeneration, GeneratedArticle } from '@/hooks/use-full-article-generation';
import { useGenerationHistory } from '@/hooks/use-generation-history';
import { useConfetti } from '@/hooks/use-confetti';
import { useImageApproval } from '@/contexts/ImageApprovalContext';
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes-warning';
import { useNavigationBlock } from '@/contexts/NavigationBlockContext';
import { useCommemorativeDates } from '@/hooks/use-commemorative-dates';
import { CommemorativeDateSettingsDialog } from '@/components/dashboard/CommemorativeDateSettingsDialog';
import { COMMEMORATIVE_DATES, getEventDate } from '@/data/commemorative-dates';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

interface SubnicheItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

// Design Interno - Áreas Sociais
const DESIGN_AREAS_SOCIAIS: SubnicheItem[] = [
  { id: 'sala', label: 'Sala', icon: Sofa },
  { id: 'sala-jantar', label: 'Sala de Jantar', icon: UtensilsCrossed },
  { id: 'lareira', label: 'Lareira', icon: Flame },
  { id: 'area-gourmet', label: 'Área Gourmet', icon: ChefHat },
];

// Design Interno - Áreas Íntimas
const DESIGN_AREAS_INTIMAS: SubnicheItem[] = [
  { id: 'quarto', label: 'Quarto', icon: Bed },
  { id: 'banheiro', label: 'Banheiro', icon: Bath },
  { id: 'escritorio', label: 'Escritório', icon: Briefcase },
];

// Design Interno - Áreas de Serviço/Externas
const DESIGN_AREAS_SERVICO: SubnicheItem[] = [
  { id: 'cozinha', label: 'Cozinha', icon: CookingPot },
  { id: 'varanda', label: 'Varanda', icon: Sun },
  { id: 'area-servico', label: 'Área de Serviço', icon: WashingMachine },
  { id: 'piscina', label: 'Piscina', icon: Waves },
];

const JARDIM_TEMAS_GERAIS: SubnicheItem[] = [
  { id: 'jardim', label: 'Jardim', icon: TreeDeciduous },
  { id: 'decoracao', label: 'Dicas de Decoração', icon: Palette },
  { id: 'cuidados', label: 'Cuidados com a Plantação', icon: Sprout },
  { id: 'jardim-vertical', label: 'Jardim Vertical', icon: Layers },
  { id: 'jardim-suculentas', label: 'Suculentas e Cactos', icon: Flower2 },
  { id: 'jardim-ervas', label: 'Horta de Ervas', icon: Leaf },
  { id: 'jardim-flores', label: 'Flores Ornamentais', icon: Flower },
  { id: 'jardim-paisagismo', label: 'Paisagismo', icon: TreePine },
  { id: 'jardim-hidroponia', label: 'Hidroponia', icon: Droplets },
  { id: 'jardim-sustentavel', label: 'Jardim Sustentável', icon: Recycle },
  { id: 'jardim-halloween', label: 'Halloween', icon: Ghost },
];

const ARQUITETURA_SUBNICHES: SubnicheItem[] = [
  { id: 'colonial', label: 'Colonial', icon: Castle },
  { id: 'industrial', label: 'Industrial', icon: Factory },
  { id: 'moderno', label: 'Moderno', icon: Building2 },
  { id: 'neolitico', label: 'Neolítico', icon: Mountain },
  { id: 'europeu', label: 'Europeu', icon: Church },
  { id: 'nordico', label: 'Nórdico', icon: Snowflake },
  { id: 'neo-classico', label: 'Neo Clássico', icon: Columns3 },
];

function GenerateManualContentPage() {
  const [showPreview, setShowPreview] = useState(false);
  const [showImageApproval, setShowImageApproval] = useState(false);
  const [designSelected, setDesignSelected] = useState<string[]>([]);
  const [jardimSelected, setJardimSelected] = useState<string[]>([]);
  const [arquiteturaSelected, setArquiteturaSelected] = useState<string[]>([]);
  const [commemorativeSelected, setCommemorativeSelected] = useState<string | null>(null);
  const [articleSaved, setArticleSaved] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const { requireApproval } = useImageApproval();
  const { activeDates, hasActiveDate } = useCommemorativeDates();
  
  const {
    isGenerating,
    article,
    steps,
    startTime,
    currentTopic,
    generateArticle,
    saveArticle,
    resetGeneration,
    cancelGeneration,
    setArticle,
    clearPersistedArticle,
    setCurrentTopic,
  } = useFullArticleGeneration();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Show preview automatically if there's a persisted article on mount
  useEffect(() => {
    if (article && !isGenerating) {
      setShowPreview(true);
      setArticleSaved(true); // Article was auto-saved previously
    }
    // Only run on mount, not on every article change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    history,
    isLoading: isLoadingHistory,
    addToHistory,
    deleteFromHistory,
    updateHistoryArticleId,
  } = useGenerationHistory();

  const { fireConfetti } = useConfetti();

  // Determine if there are unsaved changes
  const hasUnsavedChanges = article !== null && !articleSaved && !isGenerating;

  // Navigation blocking hook
  const {
    showNavigationDialog,
    confirmNavigation,
    cancelNavigation,
    requestNavigation,
  } = useUnsavedChangesWarning(hasUnsavedChanges);

  // Register navigation blocker in context
  const { setRequestNavigation } = useNavigationBlock();

  useEffect(() => {
    setRequestNavigation(hasUnsavedChanges ? requestNavigation : null);
    return () => setRequestNavigation(null);
  }, [hasUnsavedChanges, requestNavigation, setRequestNavigation]);

  // Scroll to progress when generation starts
  useEffect(() => {
    if (isGenerating && progressRef.current) {
      progressRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isGenerating]);

  const toggleDesign = (id: string) => {
    setDesignSelected(prev => 
      prev.includes(id) ? [] : [id]
    );
  };

  const toggleJardim = (id: string) => {
    setJardimSelected(prev => 
      prev.includes(id) ? [] : [id]
    );
  };

  const toggleArquitetura = (id: string) => {
    setArquiteturaSelected(prev => 
      prev.includes(id) ? [] : [id]
    );
  };

  const buildDesignTopic = () => {
    const allDesignSubniches = [...DESIGN_AREAS_SOCIAIS, ...DESIGN_AREAS_INTIMAS, ...DESIGN_AREAS_SERVICO];
    const labels = designSelected.map(id => 
      allDesignSubniches.find(s => s.id === id)?.label
    ).filter(Boolean);
    return `Dicas de design interno para ${labels.join(', ').toLowerCase()}`;
  };

  const buildJardimTopic = () => {
    const labels = jardimSelected.map(id => 
      JARDIM_TEMAS_GERAIS.find(s => s.id === id)?.label
    ).filter(Boolean);
    return `Jardim: ${labels.join(', ').toLowerCase()}`;
  };

  const buildArquiteturaTopic = () => {
    const labels = arquiteturaSelected.map(id => 
      ARQUITETURA_SUBNICHES.find(s => s.id === id)?.label
    ).filter(Boolean);
    return `Dicas de arquitetura em estilo ${labels.join(', ').toLowerCase()}`;
  };

  const handleGenerationComplete = async (result: GeneratedArticle | null, topic: string) => {
    if (result) {
      if (requireApproval) {
        setShowImageApproval(true);
      } else {
        setShowPreview(true);
      }
      fireConfetti();
      setArticleSaved(true);
      await addToHistory(topic, result.title || null, null, 'success');
    } else {
      await addToHistory(topic, null, null, 'error');
    }
  };

  const handleGenerateDesign = async () => {
    setShowPreview(false);
    setShowImageApproval(false);
    setArticleSaved(false);
    const topic = buildDesignTopic();
    setCurrentTopic(topic);
    const result = await generateArticle(topic);
    await handleGenerationComplete(result, topic);
  };

  const handleGenerateJardim = async () => {
    setShowPreview(false);
    setShowImageApproval(false);
    setArticleSaved(false);
    const topic = buildJardimTopic();
    setCurrentTopic(topic);
    const result = await generateArticle(topic);
    await handleGenerationComplete(result, topic);
  };

  const handleGenerateArquitetura = async () => {
    setShowPreview(false);
    setShowImageApproval(false);
    setArticleSaved(false);
    const topic = buildArquiteturaTopic();
    setCurrentTopic(topic);
    const result = await generateArticle(topic);
    await handleGenerationComplete(result, topic);
  };

  const handleGenerateCommemorativeDate = async () => {
    const date = COMMEMORATIVE_DATES.find(d => d.id === commemorativeSelected);
    if (!date) return;
    
    setShowPreview(false);
    setShowImageApproval(false);
    setArticleSaved(false);
    setCurrentTopic(date.topicSuggestion);
    const result = await generateArticle(date.topicSuggestion);
    await handleGenerationComplete(result, date.topicSuggestion);
  };

  const handleRegenerateFromHistory = async (topic: string) => {
    setShowPreview(false);
    setShowImageApproval(false);
    setArticleSaved(false);
    setCurrentTopic(topic);
    const result = await generateArticle(topic);
    await handleGenerationComplete(result, topic);
  };

  const handleRegenerate = () => {
    setShowPreview(false);
    setShowImageApproval(false);
    setArticleSaved(true);
    resetGeneration();
  };

  const handleImagesApproved = (coverImage: string | undefined, galleryImages: string[]) => {
    if (article) {
      setArticle({
        ...article,
        coverImage,
        galleryImages,
      });
    }
    setShowImageApproval(false);
    setShowPreview(true);
  };

  const handleCancelApproval = () => {
    setShowImageApproval(false);
    setShowPreview(true);
  };

  const handleSaveDraft = async () => {
    const saved = await saveArticle(false);
    if (saved && currentTopic) {
      await updateHistoryArticleId(currentTopic, saved.id);
      setArticleSaved(true);
    }
  };

  const handlePublish = async () => {
    const saved = await saveArticle(true);
    if (saved && currentTopic) {
      await updateHistoryArticleId(currentTopic, saved.id);
    }
    
    // Always return to selection screen after publish attempt
    resetToSelectionScreen();
  };

  const handleDiscard = () => {
    // Discard the generated article and return to selection screen
    resetToSelectionScreen();
  };

  const resetToSelectionScreen = () => {
    setArticleSaved(true); // Prevent unsaved changes warning
    setArticle(null);
    clearPersistedArticle();
    resetGeneration();
    setCurrentTopic('');
    setDesignSelected([]);
    setJardimSelected([]);
    setArquiteturaSelected([]);
    setCommemorativeSelected(null);
    setShowPreview(false);
    setShowImageApproval(false);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderSubnicheCard = (
    item: SubnicheItem,
    selectedItems: string[],
    toggleFn: (id: string) => void,
    prefix: string
  ) => {
    const IconComponent = item.icon;
    const isChecked = selectedItems.includes(item.id);
    return (
      <div 
        key={item.id} 
        className={cn(
          "group flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
          isChecked 
            ? "border-primary bg-primary/10 shadow-sm shadow-primary/10" 
            : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
        )}
        onClick={() => !isGenerating && toggleFn(item.id)}
      >
        <Checkbox
          id={`${prefix}-${item.id}`}
          checked={isChecked}
          onCheckedChange={() => toggleFn(item.id)}
          disabled={isGenerating}
          className="pointer-events-none"
        />
        <IconComponent className={cn(
          "h-4 w-4 transition-colors",
          isChecked ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )} />
        <Label 
          htmlFor={`${prefix}-${item.id}`}
          className="text-sm font-medium cursor-pointer flex-1"
        >
          {item.label}
        </Label>
      </div>
    );
  };

  const showCategorySelection = !showPreview && !showImageApproval;

  // Determine if any category has a selection
  const hasAnySelection = designSelected.length > 0 || jardimSelected.length > 0 || arquiteturaSelected.length > 0 || commemorativeSelected !== null;

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.1),transparent_50%)]" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Gerar Conteúdo com IA
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Crie artigos completos automaticamente
                </p>
              </div>
            </div>
            {hasAnySelection && !isGenerating && (
              <Button 
                size="lg" 
                className="rounded-full px-6 gap-2 shadow-lg shadow-primary/25"
                onClick={() => {
                  if (designSelected.length > 0) handleGenerateDesign();
                  else if (jardimSelected.length > 0) handleGenerateJardim();
                  else if (arquiteturaSelected.length > 0) handleGenerateArquitetura();
                  else if (commemorativeSelected) handleGenerateCommemorativeDate();
                }}
              >
                <AIIcon size="sm" />
                Gerar Artigo
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Section - Always visible, scroll target */}
        <div ref={progressRef}>
          <GenerationProgressHero 
            steps={steps}
            startTime={startTime ?? undefined}
            isGenerating={isGenerating}
            onCancel={cancelGeneration}
            topic={currentTopic}
          />
        </div>

        {/* Category Selection Cards */}
        {showCategorySelection && (
          <>
            <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
              {/* Design Interno Card */}
              <Card className="border-border/50 hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Home className="h-4 w-4 text-primary" />
                    </div>
                    Design Interno
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Selecione um cômodo para gerar dicas de design
                  </CardDescription>
                  {designSelected.length > 0 && (() => {
                    const allDesign = [...DESIGN_AREAS_SOCIAIS, ...DESIGN_AREAS_INTIMAS, ...DESIGN_AREAS_SERVICO];
                    const selected = allDesign.find(s => s.id === designSelected[0]);
                    if (!selected) return null;
                    const IconComp = selected.icon;
                    return (
                      <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                        <IconComp className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">{selected.label}</span>
                      </div>
                    );
                  })()}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Áreas Sociais */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Áreas Sociais
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {DESIGN_AREAS_SOCIAIS.map((item) => 
                        renderSubnicheCard(item, designSelected, toggleDesign, 'design')
                      )}
                    </div>
                  </div>

                  {/* Áreas Íntimas */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Áreas Íntimas
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {DESIGN_AREAS_INTIMAS.map((item) => 
                        renderSubnicheCard(item, designSelected, toggleDesign, 'design')
                      )}
                    </div>
                  </div>

                  {/* Áreas de Serviço/Externas */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Serviço & Externas
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {DESIGN_AREAS_SERVICO.map((item) => 
                        renderSubnicheCard(item, designSelected, toggleDesign, 'design')
                      )}
                    </div>
                  </div>

                  <Button
                    className="w-full rounded-xl"
                    onClick={handleGenerateDesign}
                    disabled={isGenerating || designSelected.length === 0}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <AIIcon size="sm" className="mr-2" />
                        Gerar Artigo
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Jardim Card */}
              <Card className="border-border/50 hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Leaf className="h-4 w-4 text-primary" />
                    </div>
                    Jardim
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Selecione um tema sobre jardinagem
                  </CardDescription>
                  {jardimSelected.length > 0 && (() => {
                    const selected = JARDIM_TEMAS_GERAIS.find(s => s.id === jardimSelected[0]);
                    if (!selected) return null;
                    const IconComp = selected.icon;
                    return (
                      <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                        <IconComp className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">{selected.label}</span>
                      </div>
                    );
                  })()}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {JARDIM_TEMAS_GERAIS.map((item) => 
                      renderSubnicheCard(item, jardimSelected, toggleJardim, 'jardim')
                    )}
                  </div>

                  <Button
                    className="w-full rounded-xl"
                    onClick={handleGenerateJardim}
                    disabled={isGenerating || jardimSelected.length === 0}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <AIIcon size="sm" className="mr-2" />
                        Gerar Artigo
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Arquitetura Card */}
              <Card className="border-border/50 hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Landmark className="h-4 w-4 text-primary" />
                    </div>
                    Arquitetura
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Selecione um estilo arquitetônico
                  </CardDescription>
                  {arquiteturaSelected.length > 0 && (() => {
                    const selected = ARQUITETURA_SUBNICHES.find(s => s.id === arquiteturaSelected[0]);
                    if (!selected) return null;
                    const IconComp = selected.icon;
                    return (
                      <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                        <IconComp className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">{selected.label}</span>
                      </div>
                    );
                  })()}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {ARQUITETURA_SUBNICHES.map((item) => 
                      renderSubnicheCard(item, arquiteturaSelected, toggleArquitetura, 'arquitetura')
                    )}
                  </div>

                  <Button
                    className="w-full rounded-xl"
                    onClick={handleGenerateArquitetura}
                    disabled={isGenerating || arquiteturaSelected.length === 0}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <AIIcon size="sm" className="mr-2" />
                        Gerar Artigo
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Commemorative Dates Card */}
            <Card className="border-border/50 hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    Datas Comemorativas
                  </CardTitle>
                  <CommemorativeDateSettingsDialog />
                </div>
                <CardDescription className="text-sm">
                  Gere artigos temáticos para datas especiais do ano
                </CardDescription>
                {commemorativeSelected && (() => {
                  const selected = COMMEMORATIVE_DATES.find(d => d.id === commemorativeSelected);
                  if (!selected) return null;
                  const IconComp = selected.icon;
                  return (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                      <IconComp className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium text-primary truncate">{selected.label}</span>
                    </div>
                  );
                })()}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Active Date Alerts */}
                {hasActiveDate && (
                  <div className="mb-4">
                    <CommemorativeDateAlert 
                      dates={activeDates}
                      onGenerateArticle={(date) => {
                        setCurrentTopic(date.topicSuggestion);
                        setShowPreview(false);
                        setShowImageApproval(false);
                        setArticleSaved(false);
                        generateArticle(date.topicSuggestion).then(async (result) => {
                          if (result) {
                            if (requireApproval) {
                              setShowImageApproval(true);
                            } else {
                              setShowPreview(true);
                            }
                            fireConfetti();
                            setArticleSaved(true);
                            await addToHistory(date.topicSuggestion, result.title || null, null, 'success');
                          } else {
                            await addToHistory(date.topicSuggestion, null, null, 'error');
                          }
                        });
                      }}
                    />
                  </div>
                )}

                {/* All Commemorative Dates Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Todas as Datas
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {COMMEMORATIVE_DATES.map((date) => {
                      const IconComp = date.icon;
                      const isSelected = commemorativeSelected === date.id;
                      const eventDate = getEventDate(date);
                      const formattedDate = format(eventDate, "d MMM", { locale: ptBR });
                      
                      return (
                        <div
                          key={date.id}
                          onClick={() => !isGenerating && setCommemorativeSelected(isSelected ? null : date.id)}
                          className={cn(
                            "flex flex-col items-center gap-1 p-2 sm:p-3 rounded-xl border transition-all cursor-pointer text-center min-h-[70px]",
                            isSelected 
                              ? "border-primary bg-primary/10 shadow-sm" 
                              : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
                          )}
                        >
                          <IconComp className={cn(
                            "h-4 w-4 sm:h-5 sm:w-5",
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )} />
                          <span className={cn(
                            "text-[10px] sm:text-xs font-medium leading-tight line-clamp-2",
                            isSelected ? "text-primary" : ""
                          )}>
                            {date.label}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                            {formattedDate}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Button
                  className="w-full rounded-xl"
                  onClick={handleGenerateCommemorativeDate}
                  disabled={isGenerating || !commemorativeSelected}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <AIIcon size="sm" className="mr-2" />
                      Gerar Artigo Comemorativo
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generation History */}
            <GenerationHistory
              history={history}
              isLoading={isLoadingHistory}
              onRegenerate={handleRegenerateFromHistory}
              onDelete={deleteFromHistory}
              isGenerating={isGenerating}
            />
          </>
        )}

        {/* Image Approval Section */}
        {showImageApproval && article && (
          <div className="space-y-6">
            <ImageApprovalPreview
              coverImage={article.coverImage}
              galleryImages={article.galleryImages}
              galleryPrompts={article.galleryPrompts}
              visualContext={article.visualContext}
              mainSubject={article.mainSubject}
              title={article.title}
              categorySlug={article.categorySlug}
              tags={article.tags}
              onImagesApproved={handleImagesApproved}
              onCancel={handleCancelApproval}
            />
          </div>
        )}

        {/* Preview Section */}
        {showPreview && article && (
          <div className="space-y-6">
            {/* Info Banner */}
            <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Save className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary">Rascunho salvo automaticamente</p>
                    <p className="text-sm text-muted-foreground">
                      Os administradores foram notificados por e-mail e receberão uma notificação no painel.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Bar */}
            <Card className="border-border/50">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    className="rounded-xl"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Gerar Novo
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDiscard}
                    disabled={isGenerating}
                    className="rounded-xl text-destructive border-destructive/50 hover:bg-destructive/10"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                  <div className="flex-1" />
                  <Button 
                    onClick={handlePublish}
                    disabled={isGenerating}
                    className="rounded-xl shadow-lg shadow-primary/25"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Publicar Agora
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Article Preview */}
            <ArticlePreviewFull article={article} />
          </div>
        )}
      </div>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showNavigationDialog} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Artigo não salvo</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem um artigo gerado que ainda não foi salvo. Se sair agora, perderá todo o conteúdo. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelNavigation}>
              Continuar Editando
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmNavigation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sair sem Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

export default function GenerateManualContent() {
  return (
    <PermissionGate permission="can_generate_content">
      <GenerateManualContentPage />
    </PermissionGate>
  );
}
