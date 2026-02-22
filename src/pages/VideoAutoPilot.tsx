import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PermissionGate } from '@/components/PermissionGate';
import { useArticleVideos } from '@/hooks/use-article-videos';
import { useVideoStats } from '@/hooks/use-video-stats';
import { useVideoGenerationLogs } from '@/hooks/use-video-generation-logs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Video, Play, RefreshCw, Trash2, Settings, BarChart3,
  CheckCircle, XCircle, Clock, Loader2, Eye, EyeOff
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

function VideoAutoPilotContent() {
  const {
    articlesWithVideos, settings, isLoading, isProcessing,
    toggleGlobalEnabled, updateDailyLimit, toggleVideoEnabled,
    regenerateVideo, deleteVideo, processQueue, fetchVideos
  } = useArticleVideos();

  const { data: stats, isLoading: statsLoading } = useVideoStats();
  const { logs, isLoading: logsLoading, totalPages, page, setPage, clearLogs } = useVideoGenerationLogs();

  const [dailyLimitInput, setDailyLimitInput] = useState(String(settings.daily_limit));
  const [filter, setFilter] = useState<'all' | 'with' | 'without'>('all');

  const filteredArticles = articlesWithVideos.filter(a => {
    if (filter === 'with') return a.video !== null;
    if (filter === 'without') return a.video === null;
    return true;
  });

  const handleSaveDailyLimit = () => {
    const val = parseInt(dailyLimitInput);
    if (isNaN(val) || val < 1) { toast.error('Valor inválido'); return; }
    updateDailyLimit(val);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Video className="h-6 w-6 text-primary" />
              Video AutoPilot
            </h1>
            <p className="text-muted-foreground text-sm">
              Geração automática de vídeos do YouTube para artigos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="global-toggle" className="text-sm font-medium">
              {settings.enabled ? 'Ativado' : 'Desativado'}
            </Label>
            <Switch
              id="global-toggle"
              checked={settings.enabled}
              onCheckedChange={toggleGlobalEnabled}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Video className="h-3.5 w-3.5" /> Total de Vídeos
              </div>
              <p className="text-2xl font-bold">{statsLoading ? '...' : stats?.totalVideos ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <CheckCircle className="h-3.5 w-3.5" /> Cobertura
              </div>
              <p className="text-2xl font-bold">{statsLoading ? '...' : `${stats?.coveragePercentage ?? 0}%`}</p>
              {!statsLoading && stats && (
                <Progress value={stats.coveragePercentage} className="mt-2 h-1.5" />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Clock className="h-3.5 w-3.5" /> Hoje
              </div>
              <p className="text-2xl font-bold">{statsLoading ? '...' : stats?.videosAddedToday ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <BarChart3 className="h-3.5 w-3.5" /> Sem vídeo
              </div>
              <p className="text-2xl font-bold">{statsLoading ? '...' : stats?.articlesWithoutVideo ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="articles">
          <TabsList>
            <TabsTrigger value="articles">Artigos</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* Articles Tab */}
          <TabsContent value="articles" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex gap-2">
                <Badge variant={filter === 'all' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setFilter('all')}>Todos</Badge>
                <Badge variant={filter === 'with' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setFilter('with')}>Com vídeo</Badge>
                <Badge variant={filter === 'without' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setFilter('without')}>Sem vídeo</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => fetchVideos()} disabled={isProcessing}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${isProcessing ? 'animate-spin' : ''}`} /> Atualizar
                </Button>
                <Button size="sm" onClick={() => processQueue(5)} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
                  Processar fila
                </Button>
              </div>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Artigo</TableHead>
                      <TableHead>Vídeo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArticles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nenhum artigo encontrado
                        </TableCell>
                      </TableRow>
                    ) : filteredArticles.slice(0, 50).map(article => (
                      <TableRow key={article.id}>
                        <TableCell className="max-w-[250px]">
                          <p className="font-medium text-sm truncate">{article.title}</p>
                          <p className="text-xs text-muted-foreground">{article.category_slug}</p>
                        </TableCell>
                        <TableCell>
                          {article.video ? (
                            <a href={article.video.youtube_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block max-w-[200px]">
                              {article.video.video_title || article.video.youtube_video_id}
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {article.video ? (
                            <Badge variant={article.video.is_enabled ? 'default' : 'secondary'} className="text-xs">
                              {article.video.is_enabled ? 'Ativo' : 'Inativo'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Pendente</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {article.video && (
                              <>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleVideoEnabled(article.id, !article.video!.is_enabled)} title={article.video.is_enabled ? 'Desativar' : 'Ativar'}>
                                  {article.video.is_enabled ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteVideo(article.id)} title="Remover">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => regenerateVideo(article.id)} disabled={isProcessing} title="Buscar vídeo">
                              <RefreshCw className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Histórico de geração de vídeos</p>
              <Button size="sm" variant="outline" onClick={async () => { const ok = await clearLogs(); if (ok) toast.success('Logs limpos'); }}>
                <Trash2 className="h-4 w-4 mr-1" /> Limpar
              </Button>
            </div>
            <Card>
              {logsLoading ? (
                <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : logs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Nenhum log encontrado</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Artigo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duração</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">{format(new Date(log.executed_at), "dd/MM/yy HH:mm", { locale: ptBR })}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{log.article_title || '—'}</TableCell>
                        <TableCell>
                          {log.status === 'success' ? <CheckCircle className="h-4 w-4 text-green-500" /> :
                           log.status === 'error' ? (
                            <span className="flex items-center gap-1 text-destructive text-xs" title={log.error_message || ''}>
                              <XCircle className="h-4 w-4" /> Erro
                            </span>
                           ) : <Clock className="h-4 w-4 text-yellow-500" />}
                        </TableCell>
                        <TableCell className="text-xs">{log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 p-3">
                  <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                  <span className="text-sm text-muted-foreground self-center">{page + 1}/{totalPages}</span>
                  <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Próximo</Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Settings className="h-5 w-5" /> Configurações</CardTitle>
                <CardDescription>Configure a geração automática de vídeos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Geração automática</Label>
                    <p className="text-xs text-muted-foreground">Buscar vídeos automaticamente para novos artigos</p>
                  </div>
                  <Switch checked={settings.enabled} onCheckedChange={toggleGlobalEnabled} />
                </div>
                <div className="space-y-2">
                  <Label>Limite diário</Label>
                  <div className="flex gap-2 max-w-xs">
                    <Input type="number" min={1} max={100} value={dailyLimitInput} onChange={e => setDailyLimitInput(e.target.value)} />
                    <Button onClick={handleSaveDailyLimit}>Salvar</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Máximo de vídeos processados por dia</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

export default function VideoAutoPilot() {
  return (
    <PermissionGate permission="can_use_video_autopilot">
      <VideoAutoPilotContent />
    </PermissionGate>
  );
}
