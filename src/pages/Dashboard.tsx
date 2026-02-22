import { useState, useMemo } from 'react';
import { FileText, Eye, TrendingUp, Calendar, Loader2, Search, Wand2, Youtube, Video, VideoOff, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useDashboardStats, useRecentArticles, useRecentActivity, useViewsChart, calculateChange } from '@/hooks/use-dashboard-stats';
import { useSEOStats } from '@/hooks/use-seo-stats';
import { useVideoStats } from '@/hooks/use-video-stats';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { SEOOverview } from '@/components/dashboard/SEOOverview';
import { TopArticlesRanking } from '@/components/dashboard/TopArticlesRanking';
import { KeywordCloud } from '@/components/dashboard/KeywordCloud';
import { SEOArticleTable } from '@/components/dashboard/SEOArticleTable';
import { invokeEdgeFunction } from '@/lib/edge-functions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type PeriodOption = '7' | '14' | '30' | '90' | 'this-month' | 'last-month';

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('14');
  const [isExpandingExcerpts, setIsExpandingExcerpts] = useState(false);

  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date = now, label: string;
    switch (selectedPeriod) {
      case '7': start = subDays(now, 6); label = 'Últimos 7 dias'; break;
      case '14': start = subDays(now, 13); label = 'Últimos 14 dias'; break;
      case '30': start = subDays(now, 29); label = 'Últimos 30 dias'; break;
      case '90': start = subDays(now, 89); label = 'Últimos 90 dias'; break;
      case 'this-month': start = startOfMonth(now); label = 'Este mês'; break;
      case 'last-month': start = startOfMonth(subMonths(now, 1)); end = endOfMonth(subMonths(now, 1)); label = 'Mês passado'; break;
      default: start = subDays(now, 13); label = 'Últimos 14 dias';
    }
    return { startDate: start, endDate: end, label };
  }, [selectedPeriod]);

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentArticles, isLoading: articlesLoading } = useRecentArticles(5);
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(5);
  const { data: viewsData, isLoading: chartLoading } = useViewsChart(dateRange.startDate, dateRange.endDate);
  const { data: seoStats, isLoading: seoLoading, refetch: refetchSEO } = useSEOStats();
  const { data: videoStats, isLoading: videoStatsLoading } = useVideoStats();

  const handleExpandExcerpts = async () => {
    setIsExpandingExcerpts(true);
    try {
      const { data, error } = await invokeEdgeFunction('expand-excerpts');
      if (error) throw error;
      if (data.updated > 0) { toast.success(`${data.updated} excerpts expandidos!`); refetchSEO(); }
      else toast.info('Todos os excerpts já estão otimizados!');
    } catch (error) { toast.error('Erro ao expandir excerpts'); }
    finally { setIsExpandingExcerpts(false); }
  };

  const shortExcerptsCount = seoStats?.articlesSEO?.filter((a: any) => !a.criteria.hasOptimalExcerpt).length ?? 0;

  const statsCards = [
    { title: 'Artigos Publicados', value: stats?.totalArticles ?? 0, icon: FileText, change: calculateChange(stats?.totalArticles ?? 0, stats?.articlesLastMonth ?? 0) },
    { title: 'Visualizações', value: stats?.totalViews ?? 0, icon: Eye, change: calculateChange(stats?.viewsThisMonth ?? 0, stats?.viewsLastMonth ?? 0) },
    { title: 'Engajamento', value: `${stats?.engagement ?? 0}`, icon: TrendingUp, change: 'views/artigo' },
    { title: 'Este Mês', value: stats?.articlesThisMonth ?? 0, icon: Calendar, change: 'artigos publicados' },
  ];

  const formatDateStr = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "dd MMM yyyy", { locale: ptBR });
  };

  const chartConfig = { views: { label: "Visualizações", color: "hsl(var(--primary))" } };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie seu conteúdo e acompanhe as métricas</p>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => (
            <Card key={stat.title} className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                {statsLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
                  <><div className="text-lg sm:text-2xl font-bold">{stat.value}</div><p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.change}</p></>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Views Chart */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 p-3 sm:p-6">
            <div><CardTitle className="text-base sm:text-lg">Visualizações</CardTitle><CardDescription className="text-xs sm:text-sm">{dateRange.label}</CardDescription></div>
            <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as PeriodOption)}>
              <SelectTrigger className="w-full sm:w-[160px] h-8 sm:h-10 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem><SelectItem value="14">Últimos 14 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem><SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="this-month">Este mês</SelectItem><SelectItem value="last-month">Mês passado</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            {chartLoading ? (
              <div className="flex items-center justify-center h-[180px] sm:h-[250px]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : viewsData && viewsData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[180px] sm:h-[250px] w-full">
                <AreaChart data={viewsData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <defs><linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#viewsGradient)" />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[180px] sm:h-[250px] text-muted-foreground text-sm">Nenhuma visualização registrada</div>
            )}
          </CardContent>
        </Card>

        {/* Video Stats */}
        <div className="space-y-3">
          <div className="flex items-center gap-2"><Youtube className="h-4 w-4 text-destructive" /><h2 className="text-lg font-semibold">Vídeos do YouTube</h2></div>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/50"><CardHeader className="pb-1 p-3"><CardTitle className="text-xs font-medium text-muted-foreground">Total</CardTitle></CardHeader><CardContent className="p-3 pt-0">{videoStatsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <div className="text-lg font-bold">{videoStats?.totalVideos ?? 0}</div>}</CardContent></Card>
            <Card className="border-border/50"><CardHeader className="pb-1 p-3"><CardTitle className="text-xs font-medium text-muted-foreground">Cobertura</CardTitle></CardHeader><CardContent className="p-3 pt-0">{videoStatsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><div className="text-lg font-bold">{videoStats?.coveragePercentage ?? 0}%</div><Progress value={videoStats?.coveragePercentage ?? 0} className="h-1.5 mt-2" /></>}</CardContent></Card>
            <Card className="border-border/50"><CardHeader className="pb-1 p-3"><CardTitle className="text-xs font-medium text-muted-foreground">Sem Vídeo</CardTitle></CardHeader><CardContent className="p-3 pt-0"><div className="text-lg font-bold text-orange-500">{videoStats?.articlesWithoutVideo ?? 0}</div></CardContent></Card>
            <Card className="border-border/50"><CardHeader className="pb-1 p-3"><CardTitle className="text-xs font-medium text-muted-foreground">Este Mês</CardTitle></CardHeader><CardContent className="p-3 pt-0"><div className="text-lg font-bold">{videoStats?.videosAddedThisMonth ?? 0}</div></CardContent></Card>
          </div>
        </div>

        {/* SEO */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Search className="h-4 w-4 text-primary" /><h2 className="text-lg font-semibold">Análise SEO</h2></div>
            {shortExcerptsCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleExpandExcerpts} disabled={isExpandingExcerpts} className="gap-1.5">
                {isExpandingExcerpts ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                {isExpandingExcerpts ? 'Otimizando...' : `Otimizar ${shortExcerptsCount} Excerpts`}
              </Button>
            )}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <SEOOverview overallScore={seoStats?.overallScore ?? 0} criteriaPercentages={seoStats?.criteriaPercentages ?? { keywords: 0, excerpt: 0, coverImage: 0, content: 0 }} isLoading={seoLoading} />
            <KeywordCloud keywords={seoStats?.topKeywords ?? []} isLoading={seoLoading} />
          </div>
          <SEOArticleTable articles={seoStats?.articlesSEO ?? []} isLoading={seoLoading} />
        </div>

        {/* Recent Articles & Activity */}
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="border-border/50">
            <CardHeader className="p-3 sm:p-6 pb-2"><CardTitle className="text-base">Artigos Recentes</CardTitle></CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {articlesLoading ? <div className="flex justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              : recentArticles?.length ? (
                <div className="space-y-3">{recentArticles.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0"><p className="text-sm font-medium truncate">{a.title}</p><p className="text-xs text-muted-foreground">{a.category} • {formatDateStr(a.published_at)}</p></div>
                    <Badge variant={a.status === 'published' ? 'default' : 'secondary'} className="text-xs">{a.status === 'published' ? 'Pub.' : 'Rasc.'}</Badge>
                  </div>
                ))}</div>
              ) : <p className="text-center text-muted-foreground py-8">Nenhum artigo</p>}
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="p-3 sm:p-6 pb-2"><CardTitle className="text-base">Atividade</CardTitle></CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {activityLoading ? <div className="flex justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              : recentActivity?.length ? (
                <div className="space-y-3">{recentActivity.map((a: any) => (
                  <div key={a.id} className="flex items-start gap-2">
                    <div className={`mt-1.5 h-2 w-2 rounded-full ${a.type === 'published' ? 'bg-primary' : 'bg-muted-foreground'}`} />
                    <div><p className="text-sm"><span className="font-medium">{a.type === 'published' ? 'Pub.' : 'Criado'}:</span> <span className="text-muted-foreground">{a.title}</span></p><p className="text-xs text-muted-foreground">{formatDateStr(a.date)}</p></div>
                  </div>
                ))}</div>
              ) : <p className="text-center text-muted-foreground py-8">Nenhuma atividade</p>}
            </CardContent>
          </Card>
        </div>

        <TopArticlesRanking />
      </div>
    </DashboardLayout>
  );
}
