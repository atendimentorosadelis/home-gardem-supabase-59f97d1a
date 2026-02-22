import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PermissionGate } from '@/components/PermissionGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  MousePointer,
  TrendingUp,
  ExternalLink,
  Calendar,
  ArrowUpRight,
  BarChart3,
  FileText,
  Loader2
} from 'lucide-react';
import { useAllAffiliateStats } from '@/hooks/use-affiliate-clicks';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

const PERIOD_OPTIONS = [
  { value: '7', label: '7 dias' },
  { value: '14', label: '14 dias' },
  { value: '30', label: '30 dias' },
];

function useAffiliateTrendData(days: number = 30) {
  return useQuery({
    queryKey: ['affiliate-trend', days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);
      const { data: clicks, error } = await supabase
        .from('affiliate_banner_clicks')
        .select('clicked_at, article_id')
        .gte('clicked_at', startDate.toISOString())
        .order('clicked_at', { ascending: true });

      if (error) throw error;

      const dailyData = new Map<string, number>();
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        dailyData.set(dateStr, 0);
      }

      clicks?.forEach(click => {
        const dateStr = format(new Date(click.clicked_at), 'yyyy-MM-dd');
        dailyData.set(dateStr, (dailyData.get(dateStr) || 0) + 1);
      });

      return Array.from(dailyData.entries()).map(([date, clicks]) => ({
        date,
        dateLabel: format(new Date(date), 'dd/MM', { locale: ptBR }),
        clicks,
      }));
    },
  });
}

function useTopAffiliateArticles(days: number = 30) {
  return useQuery({
    queryKey: ['top-affiliate-articles', days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);
      const { data: articles, error: articlesError } = await supabase
        .from('content_articles')
        .select('id, title, slug, category_slug, affiliate_clicks_count, affiliate_banner_enabled, cover_image')
        .eq('affiliate_banner_enabled', true)
        .order('affiliate_clicks_count', { ascending: false });

      if (articlesError) throw articlesError;

      const { data: recentClicks, error: clicksError } = await supabase
        .from('affiliate_banner_clicks')
        .select('article_id')
        .gte('clicked_at', startDate.toISOString());

      if (clicksError) throw clicksError;

      const clickCounts = new Map<string, number>();
      recentClicks?.forEach(click => {
        clickCounts.set(click.article_id, (clickCounts.get(click.article_id) || 0) + 1);
      });

      const articlesWithStats = articles?.map(article => ({
        ...article,
        recentClicks: clickCounts.get(article.id) || 0,
      })) || [];

      articlesWithStats.sort((a, b) => b.recentClicks - a.recentClicks);
      return articlesWithStats;
    },
  });
}

function AffiliateDashboardContent() {
  const [period, setPeriod] = useState<string>('30');
  const days = Number(period);

  const { data: stats, isLoading: statsLoading } = useAllAffiliateStats(days);
  const { data: trendData, isLoading: trendLoading } = useAffiliateTrendData(days);
  const { data: topArticles, isLoading: articlesLoading } = useTopAffiliateArticles(days);
  const navigate = useNavigate();

  const isLoading = statsLoading || trendLoading || articlesLoading;

  const totalClicks = stats?.totalRecentClicks || 0;
  const totalArticles = stats?.totalArticlesWithBanner || 0;
  const avgClicksPerArticle = totalArticles > 0 ? Math.round(totalClicks / totalArticles) : 0;

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--primary) / 0.8)', 'hsl(var(--primary) / 0.6)', 'hsl(var(--primary) / 0.4)', 'hsl(var(--primary) / 0.3)'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ExternalLink className="h-6 w-6 text-primary" />
              Dashboard de Afiliados
            </h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe o desempenho dos banners de afiliado
            </p>
          </div>

          <ToggleGroup
            type="single"
            value={period}
            onValueChange={(value) => value && setPeriod(value)}
            className="justify-start"
          >
            {PERIOD_OPTIONS.map(option => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                aria-label={option.label}
                className="text-xs px-3"
              >
                <Calendar className="h-3 w-3 mr-1" />
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cliques Totais</CardTitle>
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{totalClicks}</div>
                  <p className="text-xs text-muted-foreground">
                    Nos últimos {days} dias
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Artigos com Banner</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalArticles}</div>
                  <p className="text-xs text-muted-foreground">
                    Banners de afiliado ativos
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Média por Artigo</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{avgClicksPerArticle}</div>
                  <p className="text-xs text-muted-foreground">
                    Cliques por artigo
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Trend Chart */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tendência de Cliques
                </CardTitle>
                <CardDescription>
                  Volume de cliques em banners de afiliado por dia
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trendData && trendData.length > 0 && trendData.some(d => d.clicks > 0) ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="dateLabel"
                          className="text-xs fill-muted-foreground"
                          tick={{ fontSize: 11 }}
                          interval={Math.floor(trendData.length / 7)}
                        />
                        <YAxis
                          className="text-xs fill-muted-foreground"
                          tick={{ fontSize: 11 }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          labelStyle={{ color: 'hsl(var(--foreground))' }}
                          formatter={(value: number) => [`${value} cliques`, 'Cliques']}
                        />
                        <Area
                          type="monotone"
                          dataKey="clicks"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorClicks)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MousePointer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum clique registrado no período</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Articles and Ranking */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Top 5 Articles Bar Chart */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top 5 Artigos
                  </CardTitle>
                  <CardDescription>
                    Artigos com mais cliques no período
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {topArticles && topArticles.length > 0 && topArticles.slice(0, 5).some(a => a.recentClicks > 0) ? (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={topArticles.slice(0, 5)}
                          layout="vertical"
                          margin={{ left: 0, right: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                          <XAxis type="number" className="text-xs fill-muted-foreground" allowDecimals={false} />
                          <YAxis
                            type="category"
                            dataKey="title"
                            className="text-xs fill-muted-foreground"
                            width={120}
                            tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                            formatter={(value: number) => [`${value} cliques`, 'Cliques']}
                          />
                          <Bar dataKey="recentClicks" radius={[0, 4, 4, 0]}>
                            {topArticles.slice(0, 5).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      <p>Sem dados suficientes</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Full Ranking List */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Ranking Completo
                  </CardTitle>
                  <CardDescription>
                    Todos os artigos com banner de afiliado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {topArticles && topArticles.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {topArticles.map((article, index) => (
                        <div
                          key={article.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/admin/articles/${article.id}`)}
                        >
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                            ${index === 0 ? 'bg-yellow-500/20 text-yellow-600' : ''}
                            ${index === 1 ? 'bg-gray-400/20 text-gray-500' : ''}
                            ${index === 2 ? 'bg-amber-600/20 text-amber-700' : ''}
                            ${index > 2 ? 'bg-muted text-muted-foreground' : ''}
                          `}>
                            {index + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                              {article.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {article.category_slug}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-1 text-primary font-semibold">
                              <MousePointer className="h-3 w-3" />
                              {article.recentClicks}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {article.affiliate_clicks_count} total
                            </p>
                          </div>

                          <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <ExternalLink className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum banner de afiliado ativo</p>
                        <p className="text-xs mt-1">Ative banners nos artigos para começar</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function AffiliateDashboard() {
  return (
    <PermissionGate permission="can_manage_affiliates">
      <AffiliateDashboardContent />
    </PermissionGate>
  );
}
