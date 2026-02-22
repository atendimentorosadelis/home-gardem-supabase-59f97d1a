import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PermissionGate } from '@/components/PermissionGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  TrendingUp,
  HardDrive,
  Activity,
  BarChart3,
  ArrowRight,
  FileImage,
  Layers,
  Calendar,
  Settings2,
  Cpu
} from 'lucide-react';
import { AIIcon } from '@/components/AIIcon';
import { useQueueStats, ImageItemSummary } from '@/hooks/use-queue-stats';
import { useCronJobHistory, CronJobExecution } from '@/hooks/use-cron-history';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const PERIOD_OPTIONS = [
  { value: '7', label: '7 dias' },
  { value: '14', label: '14 dias' },
  { value: '30', label: '30 dias' },
];

type ImageProvider = 'auto' | 'replicate' | 'cloudflare';

function QueueMonitorContent() {
  const [period, setPeriod] = useState<string>('7');
  const [imageProvider, setImageProvider] = useState<ImageProvider>('auto');
  const [isSavingProvider, setIsSavingProvider] = useState(false);
  const { data: stats, isLoading, refetch } = useQueueStats(Number(period));
  const { data: cronHistory, isLoading: isLoadingCron, refetch: refetchCron } = useCronJobHistory();
  const navigate = useNavigate();

  useEffect(() => {
    const loadAiSettings = async () => {
      const { data } = await (supabase as any)
        .from('site_settings')
        .select('value')
        .eq('key', 'ai_settings')
        .maybeSingle();

      if (data?.value) {
        const settings = data.value as { image_provider?: ImageProvider };
        setImageProvider(settings.image_provider || 'auto');
      }
    };
    loadAiSettings();
  }, []);

  const handleSaveProvider = async (provider: ImageProvider) => {
    setIsSavingProvider(true);
    try {
      const { data: existing } = await (supabase as any)
        .from('site_settings')
        .select('id')
        .eq('key', 'ai_settings')
        .maybeSingle();

      const newSettings = { image_provider: provider };

      if (existing) {
        await (supabase as any)
          .from('site_settings')
          .update({ value: newSettings, updated_at: new Date().toISOString() })
          .eq('key', 'ai_settings');
      } else {
        await (supabase as any)
          .from('site_settings')
          .insert({ key: 'ai_settings', value: newSettings });
      }

      setImageProvider(provider);
      toast.success('Provedor de imagens atualizado!');
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setIsSavingProvider(false);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel('images-monitor')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'article_images' },
        () => { refetch(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  if (isLoading || !stats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ImageIcon className="h-6 w-6" />
              Biblioteca de Imagens
            </h1>
            <p className="text-sm text-muted-foreground">
              Estatísticas e histórico das imagens geradas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* AI Provider Settings Card */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Provedor de Geração de Imagens</CardTitle>
            </div>
            <CardDescription>Escolha qual serviço de IA será usado para gerar as imagens dos artigos</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={imageProvider}
              onValueChange={(value) => handleSaveProvider(value as ImageProvider)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              disabled={isSavingProvider}
            >
              <Label
                htmlFor="auto"
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  imageProvider === 'auto' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="auto" id="auto" />
                <div>
                  <p className="font-medium">Automático</p>
                  <p className="text-xs text-muted-foreground">Replicate → Cloudflare (fallback)</p>
                </div>
              </Label>
              <Label
                htmlFor="replicate"
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  imageProvider === 'replicate' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="replicate" id="replicate" />
                <div>
                  <p className="font-medium">Replicate</p>
                  <p className="text-xs text-muted-foreground">Modelo Flux (alta qualidade)</p>
                </div>
              </Label>
              <Label
                htmlFor="cloudflare"
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  imageProvider === 'cloudflare' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value="cloudflare" id="cloudflare" />
                <div>
                  <p className="font-medium">Cloudflare AI</p>
                  <p className="text-xs text-muted-foreground">Stable Diffusion XL</p>
                </div>
              </Label>
            </RadioGroup>
            {isSavingProvider && (
              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Imagens</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">{stats.cover} capas • {stats.gallery} galeria</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Formato WebP</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.webp}</div>
              <p className="text-xs text-muted-foreground">{stats.total > 0 ? ((stats.webp / stats.total) * 100).toFixed(0) : 0}% do total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tamanho Médio</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgSizeFormatted}</div>
              <p className="text-xs text-muted-foreground">por imagem</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Hoje</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayTotal}</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">{stats.todayCover} capas</span>
                <span className="text-muted-foreground">{stats.todayGallery} galeria</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History Chart */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Histórico de Imagens
                </CardTitle>
                <CardDescription>Volume de imagens geradas por dia</CardDescription>
              </div>
              <ToggleGroup type="single" value={period} onValueChange={(value) => value && setPeriod(value)} className="justify-start">
                {PERIOD_OPTIONS.map(option => (
                  <ToggleGroupItem key={option.value} value={option.value} aria-label={option.label} className="text-xs px-3">
                    <Calendar className="h-3 w-3 mr-1" />
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </CardHeader>
          <CardContent>
            {stats.dailyHistory.every(d => d.total === 0) ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Sem dados de histórico</p>
                </div>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.dailyHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="dateFormatted" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number, name: string) => {
                        const labels: Record<string, string> = { cover: 'Capas', gallery: 'Galeria', total: 'Total' };
                        return [value, labels[name] || name];
                      }}
                    />
                    <Legend formatter={(value) => {
                      const labels: Record<string, string> = { cover: 'Capas', gallery: 'Galeria' };
                      return labels[value] || value;
                    }} />
                    <Bar dataKey="cover" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="cover" />
                    <Bar dataKey="gallery" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="gallery" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo</CardTitle>
            <CardDescription>Visão geral das imagens no acervo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatusCard label="Capas" count={stats.cover} color="bg-primary/20" icon={FileImage} />
              <StatusCard label="Galeria" count={stats.gallery} color="bg-accent" icon={Layers} />
              <StatusCard label="WebP" count={stats.webp} color="bg-muted" icon={CheckCircle2} />
              <StatusCard label="Outros Formatos" count={stats.other} color="bg-secondary" icon={ImageIcon} />
            </div>
          </CardContent>
        </Card>

        {/* Cron Job History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AIIcon size="md" />
                  Execuções Automáticas (Cron)
                </CardTitle>
                <CardDescription>Histórico de processamento automático da fila (a cada 5 min)</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchCron()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingCron ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !cronHistory || cronHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AIIcon size="lg" className="mx-auto mb-2 opacity-50 h-12 w-12" />
                <p>Nenhuma execução registrada ainda</p>
                <p className="text-xs mt-1">O cron executa a cada 5 minutos</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cronHistory.map((execution) => (
                  <CronExecutionRow key={execution.runid} execution={execution} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Images */}
        <Card>
          <CardHeader>
            <CardTitle>Imagens Recentes</CardTitle>
            <CardDescription>Últimas imagens geradas</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma imagem encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentItems.map((item) => (
                  <ImageItemRow
                    key={item.id}
                    item={item}
                    onNavigate={() => navigate(`/admin/articles/${item.article_id}`)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function QueueMonitor() {
  return (
    <PermissionGate permission="can_manage_image_queue">
      <QueueMonitorContent />
    </PermissionGate>
  );
}

function StatusCard({ label, count, color, icon: Icon }: { label: string; count: number; color: string; icon: typeof Clock }) {
  return (
    <div className={`p-4 rounded-lg ${color} text-center`}>
      <Icon className="h-5 w-5 mx-auto mb-1 opacity-70" />
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  );
}

function ImageItemRow({ item, onNavigate }: { item: ImageItemSummary; onNavigate: () => void }) {
  const formatBytes = (bytes: number | null) => {
    if (!bytes || bytes === 0) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
          {item.public_url ? (
            <img
              src={item.public_url}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <ImageIcon className="w-full h-full p-2 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate text-sm">{item.article_title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{item.image_type === 'cover' ? 'Capa' : 'Galeria'}</span>
            <span>•</span>
            <span>{item.format.toUpperCase()}</span>
            <span>•</span>
            <span>{formatBytes(item.file_size)}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(item.created_at), { locale: ptBR, addSuffix: true })}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className={item.image_type === 'cover' ? 'bg-primary/20 text-primary' : 'bg-accent text-accent-foreground'}>
          {item.image_type === 'cover' ? 'Capa' : 'Galeria'}
        </Badge>
        <Button size="sm" variant="ghost" onClick={onNavigate}>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function CronExecutionRow({ execution }: { execution: CronJobExecution }) {
  const isSuccess = execution.status === 'succeeded';
  const isFailed = execution.status === 'failed';

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="flex items-center justify-between p-2 border rounded-lg text-sm">
      <div className="flex items-center gap-3">
        {isSuccess ? (
          <CheckCircle2 className="h-4 w-4 text-accent-foreground" />
        ) : isFailed ? (
          <XCircle className="h-4 w-4 text-destructive" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        <div>
          <p className="font-medium">
            {format(new Date(execution.start_time), 'dd/MM HH:mm:ss', { locale: ptBR })}
          </p>
          <p className="text-xs text-muted-foreground">
            Duração: {formatDuration(execution.duration_ms)}
          </p>
        </div>
      </div>
      <Badge variant="secondary" className={isSuccess ? 'bg-accent text-accent-foreground' : isFailed ? 'bg-destructive/20 text-destructive' : ''}>
        {isSuccess ? 'Sucesso' : isFailed ? 'Falhou' : execution.status}
      </Badge>
    </div>
  );
}
