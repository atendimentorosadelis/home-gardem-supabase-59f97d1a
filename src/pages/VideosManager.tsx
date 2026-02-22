import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PermissionGate } from '@/components/PermissionGate';
import { useArticleVideos, ArticleWithVideo } from '@/hooks/use-article-videos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Youtube, MoreVertical, RefreshCw, Trash2, Eye, EyeOff, Play, Loader2, Video, VideoOff, Zap, Settings, ExternalLink, Power,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatDate';
import { useIsMobile } from '@/hooks/use-mobile';

function VideosContent() {
  const {
    articlesWithVideos, settings, isLoading, isProcessing,
    toggleVideoEnabled, regenerateVideo, deleteVideo, processQueue, getStats,
  } = useArticleVideos();

  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<ArticleWithVideo | null>(null);
  const [filter, setFilter] = useState<'all' | 'with' | 'without'>('all');

  const stats = getStats();

  const filteredArticles = articlesWithVideos.filter(article => {
    if (filter === 'with') return article.video !== null;
    if (filter === 'without') return article.video === null;
    return true;
  });

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteVideo(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (<Skeleton key={i} className="h-24" />))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Youtube className="h-7 w-7 text-red-500" />
              Vídeos do YouTube
            </h1>
            <p className="text-muted-foreground mt-1">Geração automática de vídeos relacionados para artigos</p>
          </div>
          <Button onClick={() => processQueue(5)} disabled={isProcessing} className="gap-2">
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Processar Fila
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardDescription>Total de Artigos</CardDescription><CardTitle className="text-2xl">{stats.total}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Com Vídeo</CardDescription><CardTitle className="text-2xl text-green-500">{stats.withVideo}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Sem Vídeo</CardDescription><CardTitle className="text-2xl text-orange-500">{stats.withoutVideo}</CardTitle></CardHeader></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Desativados</CardDescription><CardTitle className="text-2xl text-muted-foreground">{stats.disabledVideos}</CardTitle></CardHeader></Card>
        </div>

        {/* Link to Automation Settings */}
        <Card className="border-dashed bg-muted/30">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", settings.enabled ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground")}>
                  <Power className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Geração Automática: <span className={settings.enabled ? "text-emerald-500" : "text-muted-foreground"}>{settings.enabled ? 'Ativa' : 'Pausada'}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">Configure em Automação → Vídeos Auto</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/admin/video-autopilot')} className="gap-2">
                <Settings className="h-4 w-4" />
                Configurar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>Todos ({stats.total})</Button>
          <Button variant={filter === 'with' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('with')} className="gap-1"><Video className="h-4 w-4" />Com Vídeo ({stats.withVideo})</Button>
          <Button variant={filter === 'without' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('without')} className="gap-1"><VideoOff className="h-4 w-4" />Sem Vídeo ({stats.withoutVideo})</Button>
        </div>

        {/* Articles Table */}
        <Card>
          <CardContent className="p-0">
            {isMobile ? (
              <div className="divide-y divide-border/50">
                {filteredArticles.map((article) => (
                  <div key={article.id} className="p-3 space-y-3">
                    <div className="flex gap-3">
                      {article.video ? (
                        <button onClick={() => setPreviewVideo(article)} className="relative shrink-0 w-24 h-14 rounded-lg overflow-hidden bg-muted group">
                          <img src={`https://img.youtube.com/vi/${article.video.youtube_video_id}/mqdefault.jpg`} alt="Thumbnail" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="h-6 w-6 text-white fill-white" />
                          </div>
                          {!article.video.is_enabled && <div className="absolute top-1 right-1"><EyeOff className="h-3 w-3 text-white drop-shadow" /></div>}
                        </button>
                      ) : (
                        <div className="shrink-0 w-24 h-14 rounded-lg bg-muted flex items-center justify-center"><VideoOff className="h-5 w-5 text-muted-foreground" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm line-clamp-2 leading-tight">{article.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs px-1.5 py-0">{article.category_slug}</Badge>
                          {article.video && <Badge variant="default" className="bg-primary/80 text-xs px-1.5 py-0"><Video className="h-2.5 w-2.5 mr-0.5" />Vídeo</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {article.video ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => window.open(`/${article.category_slug}/${article.slug}`, '_blank')} className="h-8 text-xs gap-1 flex-1"><ExternalLink className="h-3 w-3" />Ver no Site</Button>
                          <Button size="sm" variant="outline" onClick={() => window.open(article.video?.youtube_url, '_blank')} className="h-8 text-xs gap-1"><Youtube className="h-3 w-3" /></Button>
                          <Button size="sm" variant="outline" onClick={() => toggleVideoEnabled(article.id, !article.video?.is_enabled)} className="h-8">{article.video.is_enabled ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}</Button>
                          <Button size="sm" variant="outline" onClick={() => regenerateVideo(article.id)} disabled={isProcessing} className="h-8"><RefreshCw className="h-3 w-3" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => setDeleteConfirm(article.id)} className="h-8"><Trash2 className="h-3 w-3" /></Button>
                        </>
                      ) : (
                        <Button size="sm" onClick={() => regenerateVideo(article.id)} disabled={isProcessing} className="w-full h-8 text-xs gap-1.5">
                          {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Youtube className="h-3 w-3" />}
                          Buscar Vídeo
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Thumbnail</TableHead>
                    <TableHead>Artigo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArticles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell>
                        {article.video ? (
                          <button onClick={() => setPreviewVideo(article)} className="relative w-20 h-12 rounded-md overflow-hidden bg-muted group cursor-pointer">
                            <img src={`https://img.youtube.com/vi/${article.video.youtube_video_id}/mqdefault.jpg`} alt="Thumbnail" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Play className="h-5 w-5 text-white fill-white" /></div>
                          </button>
                        ) : (
                          <div className="w-20 h-12 rounded-md bg-muted flex items-center justify-center"><VideoOff className="h-4 w-4 text-muted-foreground" /></div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-xs">
                        <span className="line-clamp-2">{article.title}</span>
                        {article.video?.video_title && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{article.video.video_title}</p>}
                      </TableCell>
                      <TableCell><Badge variant="outline">{article.category_slug}</Badge></TableCell>
                      <TableCell>
                        {article.video ? (
                          article.video.is_enabled ? <Badge variant="default" className="bg-green-500"><Eye className="h-3 w-3 mr-1" />Visível</Badge> : <Badge variant="secondary"><EyeOff className="h-3 w-3 mr-1" />Oculto</Badge>
                        ) : (
                          <Badge variant="outline"><VideoOff className="h-3 w-3 mr-1" />Sem vídeo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {article.video ? (
                              <>
                                <DropdownMenuItem onClick={() => window.open(`/${article.category_slug}/${article.slug}`, '_blank')}><ExternalLink className="h-4 w-4 mr-2" />Ver no Site</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setPreviewVideo(article)}><Play className="h-4 w-4 mr-2" />Preview</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.open(article.video?.youtube_url, '_blank')}><ExternalLink className="h-4 w-4 mr-2" />Abrir no YouTube</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleVideoEnabled(article.id, !article.video?.is_enabled)}>
                                  {article.video.is_enabled ? <><EyeOff className="h-4 w-4 mr-2" />Ocultar</> : <><Eye className="h-4 w-4 mr-2" />Mostrar</>}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => regenerateVideo(article.id)} disabled={isProcessing}><RefreshCw className="h-4 w-4 mr-2" />Regenerar</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirm(article.id)}><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem onClick={() => regenerateVideo(article.id)} disabled={isProcessing}><Youtube className="h-4 w-4 mr-2" />Buscar Vídeo</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {filteredArticles.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">Nenhum artigo encontrado</div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Vídeo</AlertDialogTitle>
              <AlertDialogDescription>Tem certeza que deseja excluir este vídeo? Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Video Preview Dialog */}
        <Dialog open={!!previewVideo} onOpenChange={() => setPreviewVideo(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="line-clamp-1">{previewVideo?.video?.video_title || 'Preview do Vídeo'}</DialogTitle>
            </DialogHeader>
            {previewVideo?.video && (
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${previewVideo.video.youtube_video_id}?autoplay=1`}
                  title={previewVideo.video.video_title || 'Vídeo'}
                  className="w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

export default function VideosManager() {
  return (
    <PermissionGate permission="can_manage_videos">
      <VideosContent />
    </PermissionGate>
  );
}
