import { useState, useEffect, useCallback } from 'react';
import {
  Image as ImageIcon,
  HardDrive,
  FileImage,
  Trash2,
  RefreshCw,
  Loader2,
  Download,
  Eye,
  Search,
  Filter,
  Archive,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { AIIcon } from '@/components/AIIcon';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PermissionGate } from '@/components/PermissionGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { invokeEdgeFunction } from '@/lib/edge-functions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ArticleImage {
  id: string;
  article_id: string;
  image_type: 'cover' | 'gallery';
  image_index: number;
  public_url: string;
  format: string;
  article_title?: string;
  isBroken?: boolean;
}

interface StorageStats {
  totalImages: number;
  coverImages: number;
  galleryImages: number;
  webpCount: number;
  otherCount: number;
  brokenCount: number;
}

interface BackupLog {
  id: string;
  created_at: string;
  total_images: number;
  backed_up: number;
  failed: number;
  status: string;
  duration_ms: number | null;
}

interface BackupArticle {
  id: string;
  title: string;
  backupDate: string;
  images: {
    name: string;
    path: string;
    type: 'cover' | 'gallery';
    index: number;
  }[];
}

function getFormatFromUrl(url: string): string {
  if (!url) return 'unknown';
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('.webp')) return 'webp';
  if (lowerUrl.includes('.png')) return 'png';
  if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg')) return 'jpg';
  return 'unknown';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function ImagesDashboardContent() {
  const [images, setImages] = useState<ArticleImage[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'cover' | 'gallery'>('all');
  const [filterFormat, setFilterFormat] = useState<'all' | 'webp' | 'png' | 'jpg'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'broken' | 'valid'>('all');
  const [selectedImage, setSelectedImage] = useState<ArticleImage | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<ArticleImage | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupLogs, setBackupLogs] = useState<BackupLog[]>([]);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [backupDates, setBackupDates] = useState<string[]>([]);
  const [selectedBackupDate, setSelectedBackupDate] = useState<string | null>(null);
  const [backupArticles, setBackupArticles] = useState<BackupArticle[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [isCheckingBroken, setIsCheckingBroken] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBackupLogs = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('image_backup_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setBackupLogs(data as BackupLog[]);
      }
    } catch (error) {
      console.error('Error fetching backup logs:', error);
    }
  };

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      // Fetch articles with images from content_articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('content_articles')
        .select('id, title, cover_image, gallery_images')
        .order('created_at', { ascending: false });

      if (articlesError) throw articlesError;

      const formattedImages: ArticleImage[] = [];
      let imageIdCounter = 0;

      (articlesData || []).forEach((article) => {
        // Add cover image if exists
        if (article.cover_image) {
          formattedImages.push({
            id: `${article.id}-cover-${imageIdCounter++}`,
            article_id: article.id,
            image_type: 'cover',
            image_index: 0,
            public_url: article.cover_image,
            format: getFormatFromUrl(article.cover_image),
            article_title: article.title || 'Sem título',
          });
        }

        // Add gallery images if exist
        const galleryImages = article.gallery_images as string[] | null;
        if (galleryImages && Array.isArray(galleryImages)) {
          galleryImages.forEach((imgUrl, index) => {
            if (imgUrl && typeof imgUrl === 'string') {
              formattedImages.push({
                id: `${article.id}-gallery-${index}-${imageIdCounter++}`,
                article_id: article.id,
                image_type: 'gallery',
                image_index: index,
                public_url: imgUrl,
                format: getFormatFromUrl(imgUrl),
                article_title: article.title || 'Sem título',
              });
            }
          });
        }
      });

      setImages(formattedImages);

      // Calculate stats (brokenCount will be updated after checking)
      const coverImages = formattedImages.filter(img => img.image_type === 'cover').length;
      const galleryImages = formattedImages.filter(img => img.image_type === 'gallery').length;
      const webpCount = formattedImages.filter(img => img.format === 'webp').length;
      const otherCount = formattedImages.filter(img => img.format !== 'webp').length;

      setStats({
        totalImages: formattedImages.length,
        coverImages,
        galleryImages,
        webpCount,
        otherCount,
        brokenCount: 0,
      });
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar imagens',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
    fetchBackupLogs();
  }, []);

  const handleMigration = async () => {
    setIsMigrating(true);
    setMigrationProgress(0);

    try {
      const { data, error } = await invokeEdgeFunction('migrate-images-to-webp', {
        batchSize: 10,
      });

      if (error) throw error;

      toast({
        title: 'Migração iniciada',
        description: `${data?.processed || 0} imagens processadas`,
      });

      // Refresh the list
      await fetchImages();
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: 'Erro na migração',
        description: error instanceof Error ? error.message : 'Falha ao migrar imagens',
        variant: 'destructive',
      });
    } finally {
      setIsMigrating(false);
      setMigrationProgress(100);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);

    try {
      const { data, error } = await invokeEdgeFunction('backup-images');

      if (error) throw error;

      toast({
        title: 'Backup concluído',
        description: `${data?.stats?.backedUp || 0} imagens salvas no backup`,
      });

      // Refresh backup logs
      await fetchBackupLogs();
    } catch (error) {
      console.error('Backup error:', error);
      toast({
        title: 'Erro no backup',
        description: error instanceof Error ? error.message : 'Falha ao fazer backup',
        variant: 'destructive',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!imageToDelete) return;

    try {
      // For images stored in content_articles, we need to update the article
      const { data: article } = await supabase
        .from('content_articles')
        .select('cover_image, gallery_images')
        .eq('id', imageToDelete.article_id)
        .maybeSingle();

      if (article) {
        if (imageToDelete.image_type === 'cover') {
          await supabase
            .from('content_articles')
            .update({ cover_image: null })
            .eq('id', imageToDelete.article_id);
        } else {
          const galleryImages = (article.gallery_images as string[] | null) || [];
          const updatedGallery = galleryImages.filter((_, idx) => idx !== imageToDelete.image_index);
          await supabase
            .from('content_articles')
            .update({ gallery_images: updatedGallery })
            .eq('id', imageToDelete.article_id);
        }
      }

      toast({
        title: 'Imagem removida',
        description: 'A referência da imagem foi removida do artigo',
      });

      // Refresh list
      await fetchImages();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover imagem',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteDialog(false);
      setImageToDelete(null);
    }
  };

  const openRestoreDialog = async () => {
    setShowRestoreDialog(true);
    setIsLoadingBackups(true);
    setSelectedBackupDate(null);
    setBackupArticles([]);

    try {
      const { data, error } = await invokeEdgeFunction('restore-images', {
        action: 'list-dates',
      });

      if (error) throw error;
      setBackupDates(data?.dates || []);
    } catch (error) {
      console.error('Error loading backup dates:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar datas de backup',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const loadBackupArticles = async (date: string) => {
    setSelectedBackupDate(date);
    setIsLoadingBackups(true);

    try {
      const { data, error } = await invokeEdgeFunction('restore-images', {
        action: 'list-articles', date,
      });

      if (error) throw error;
      setBackupArticles(data?.articles || []);
    } catch (error) {
      console.error('Error loading backup articles:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar artigos do backup',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleRestore = async (articleId: string, imageType?: 'cover' | 'gallery', imageIndex?: number) => {
    if (!selectedBackupDate) return;

    setIsRestoring(true);

    try {
      const { data, error } = await invokeEdgeFunction('restore-images', {
        action: 'restore',
        date: selectedBackupDate,
        articleId,
        imageType,
        imageIndex,
      });

      if (error) throw error;

      toast({
        title: 'Restauração concluída',
        description: `Restaurado: ${data?.restored?.cover || 0} capa(s) e ${data?.restored?.gallery || 0} imagem(ns) de galeria`,
      });

      // Refresh images
      await fetchImages();
    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: 'Erro na restauração',
        description: error instanceof Error ? error.message : 'Falha ao restaurar imagens',
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Check for broken images
  const checkBrokenImages = useCallback(async () => {
    setIsCheckingBroken(true);
    const broken = new Set<string>();

    const checkImage = (url: string): Promise<boolean> => {
      return new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
        // Timeout after 5 seconds
        setTimeout(() => resolve(false), 5000);
      });
    };

    // Check images in batches of 10
    const batchSize = 10;
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (img) => {
          const isValid = await checkImage(img.public_url);
          return { id: img.id, isValid };
        })
      );

      results.forEach(({ id, isValid }) => {
        if (!isValid) {
          broken.add(id);
        }
      });
    }

    setBrokenImages(broken);
    setStats(prev => prev ? { ...prev, brokenCount: broken.size } : null);
    setIsCheckingBroken(false);

    if (broken.size > 0) {
      toast({
        title: 'Verificação concluída',
        description: `${broken.size} imagem(ns) com link quebrado encontrada(s)`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Verificação concluída',
        description: 'Todas as imagens estão funcionando corretamente',
      });
    }
  }, [images, toast]);

  // Regenerate a single broken image
  const regenerateImage = async (image: ArticleImage) => {
    setRegeneratingId(image.id);

    try {
      // Buscar contexto visual do artigo para manter consistência
      const { data: articleData } = await supabase
        .from('content_articles')
        .select('slug, main_subject, visual_context, gallery_prompts, category, tags')
        .eq('id', image.article_id)
        .maybeSingle();

      console.log('[Regenerate] Sending request for', image.article_title, 'type:', image.image_type, 'index:', image.image_index);

      const { data, error } = await invokeEdgeFunction('generate-article-image', {
        articleId: image.article_id,
        title: image.article_title,
        slug: articleData?.slug || '',
        type: image.image_type,
        imageIndex: image.image_index,
        regenerate: true,
        mainSubject: articleData?.main_subject || '',
        visualContext: articleData?.visual_context || '',
        category: articleData?.category || 'decoracao',
        tags: articleData?.tags || [],
        customPrompt: image.image_type === 'gallery' && articleData?.gallery_prompts?.[image.image_index]
          ? articleData.gallery_prompts[image.image_index]
          : undefined,
      });

      console.log('[Regenerate] Response:', data);

      if (error) throw error;

      // Update selectedImage with new URL if dialog is open
      if (data?.imageUrl && selectedImage?.id === image.id) {
        setSelectedImage({ ...image, public_url: data.imageUrl });
      }

      toast({
        title: 'Imagem regenerada',
        description: `${image.image_type === 'cover' ? 'Capa' : `Galeria ${image.image_index + 1}`} regenerada com sucesso`,
      });

      // Refresh images
      await fetchImages();
      setBrokenImages(prev => {
        const next = new Set(prev);
        next.delete(image.id);
        return next;
      });
    } catch (error) {
      console.error('Regenerate error:', error);
      toast({
        title: 'Erro ao regenerar',
        description: error instanceof Error ? error.message : 'Falha ao regenerar imagem',
        variant: 'destructive',
      });
    } finally {
      setRegeneratingId(null);
    }
  };

  // Regenerate all broken images
  const regenerateAllBroken = async () => {
    if (brokenImages.size === 0) return;

    setIsRegenerating(true);
    let success = 0;
    let failed = 0;

    const brokenList = images.filter(img => brokenImages.has(img.id));

    for (const image of brokenList) {
      try {
        // Buscar contexto visual do artigo para manter consistência
        const { data: articleData } = await supabase
          .from('content_articles')
          .select('main_subject, visual_context, gallery_prompts, category, tags')
          .eq('id', image.article_id)
          .maybeSingle();

        const { error } = await invokeEdgeFunction('generate-article-image', {
          articleId: image.article_id,
          title: image.article_title,
          type: image.image_type,
          imageIndex: image.image_index,
          regenerate: true,
          mainSubject: articleData?.main_subject || '',
          visualContext: articleData?.visual_context || '',
          category: articleData?.category || 'decoracao',
          tags: articleData?.tags || [],
          customPrompt: image.image_type === 'gallery' && articleData?.gallery_prompts?.[image.image_index]
            ? articleData.gallery_prompts[image.image_index]
            : undefined,
        });

        if (error) throw error;
        success++;
      } catch (error) {
        console.error('Regenerate error:', error);
        failed++;
      }
    }

    toast({
      title: 'Regeneração concluída',
      description: `${success} imagem(ns) regenerada(s), ${failed} falha(s)`,
    });

    await fetchImages();
    setBrokenImages(new Set());
    setIsRegenerating(false);
  };

  const filteredImages = images.filter(img => {
    const matchesSearch =
      img.article_title?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || img.image_type === filterType;
    const matchesFormat = filterFormat === 'all' || img.format === filterFormat;

    const isBroken = brokenImages.has(img.id);
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'broken' && isBroken) ||
      (filterStatus === 'valid' && !isBroken);

    return matchesSearch && matchesType && matchesFormat && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Biblioteca de Imagens</h1>
            <p className="text-muted-foreground">
              Gerencie, monitore e restaure imagens dos artigos
            </p>
          </div>

          {/* Action Buttons - Responsive Grid */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchImages} disabled={isLoading} className="w-full sm:w-auto">
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={checkBrokenImages}
              disabled={isCheckingBroken || isLoading}
              className="w-full sm:w-auto"
            >
              {isCheckingBroken ? (
                <>
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Verificando...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Verificar</span>
                </>
              )}
            </Button>
            {brokenImages.size > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={regenerateAllBroken}
                disabled={isRegenerating}
                className="col-span-2 sm:col-span-1 w-full sm:w-auto"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Regenerando...</span>
                  </>
                ) : (
                  <>
                    <AIIcon size="sm" className="mr-2" />
                    <span>Regenerar {brokenImages.size}</span>
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleBackup} disabled={isBackingUp} className="w-full sm:w-auto">
              {isBackingUp ? (
                <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
              ) : (
                <Archive className="h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Backup</span>
            </Button>
            <Button variant="outline" size="sm" onClick={openRestoreDialog} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Restaurar</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleMigration} disabled={isMigrating} className="col-span-2 sm:col-span-1 w-full sm:w-auto">
              {isMigrating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              <span>Migrar WebP</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards - 5 columns */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalImages || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Capas</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.coverImages || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Galeria</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.galleryImages || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">WebP</CardTitle>
              <FileImage className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.webpCount || 0}</div>
                  <Progress
                    value={((stats?.webpCount || 0) / Math.max(stats?.totalImages || 1, 1)) * 100}
                    className="mt-2 h-1"
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Card className={brokenImages.size > 0 ? 'border-destructive' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quebradas</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${brokenImages.size > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              {isCheckingBroken ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className={`text-2xl font-bold ${brokenImages.size > 0 ? 'text-destructive' : ''}`}>
                  {brokenImages.size}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Backup Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Sistema de Backup
            </CardTitle>
            <CardDescription>
              Backup automático diário às 3h da manhã. Último histórico de backups:
            </CardDescription>
          </CardHeader>
          <CardContent>
            {backupLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum backup realizado ainda.</p>
            ) : (
              <div className="space-y-3">
                {backupLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      {log.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      ) : log.status === 'completed_with_errors' ? (
                        <XCircle className="h-5 w-5 text-destructive" />
                      ) : log.status === 'running' ? (
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.backed_up} de {log.total_images} imagens
                          {log.failed > 0 && ` (${log.failed} falhas)`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={log.status === 'completed' ? 'default' : log.status === 'running' ? 'secondary' : 'outline'}>
                        {log.status === 'completed' ? 'Concluído' :
                         log.status === 'completed_with_errors' ? 'Com erros' :
                         log.status === 'running' ? 'Executando' : 'Pendente'}
                      </Badge>
                      {log.duration_ms && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {(log.duration_ms / 1000).toFixed(1)}s
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Migration Progress */}
        {isMigrating && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Migração em Progresso</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={migrationProgress} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                Convertendo imagens PNG para WebP...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <div className="w-full sm:flex-1 sm:min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-4">
                <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="cover">Capa</SelectItem>
                    <SelectItem value="gallery">Galeria</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterFormat} onValueChange={(v) => setFilterFormat(v as any)}>
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="Formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | 'broken' | 'valid')}>
                  <SelectTrigger className={`w-full sm:w-[140px] ${filterStatus === 'broken' ? 'border-destructive text-destructive' : ''}`}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="broken">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                        Quebradas ({brokenImages.size})
                      </span>
                    </SelectItem>
                    <SelectItem value="valid">OK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Imagens ({filteredImages.length})
            </CardTitle>
            <CardDescription>
              Clique em uma imagem para ver detalhes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma imagem encontrada</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredImages.map((image) => {
                  const isBroken = brokenImages.has(image.id);
                  const isRegenThisOne = regeneratingId === image.id;

                  return (
                    <div
                      key={image.id}
                      className={`group relative aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all ${
                        isBroken ? 'ring-2 ring-destructive' : 'hover:ring-2 hover:ring-primary'
                      }`}
                      onClick={() => !isRegenThisOne && setSelectedImage(image)}
                    >
                      {/* Image or Broken Placeholder */}
                      {isBroken ? (
                        <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-2 p-2">
                          <AlertTriangle className="h-8 w-8 text-destructive" />
                          <span className="text-xs text-center text-muted-foreground">Link quebrado</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              regenerateImage(image);
                            }}
                            disabled={isRegenThisOne}
                          >
                            {isRegenThisOne ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <AIIcon size="xs" className="mr-1" />
                                Regenerar
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <>
                          <img
                            src={image.public_url}
                            alt={image.article_title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={() => {
                              setBrokenImages(prev => new Set(prev).add(image.id));
                              setStats(prev => prev ? { ...prev, brokenCount: prev.brokenCount + 1 } : null);
                            }}
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="h-6 w-6 text-white" />
                          </div>
                        </>
                      )}

                      {/* Bottom badges */}
                      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex items-center gap-1 flex-wrap">
                          <Badge variant={image.image_type === 'cover' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                            {image.image_type === 'cover' ? 'Capa' : `G${image.image_index + 1}`}
                          </Badge>
                          <Badge variant={image.format === 'webp' ? 'default' : 'outline'} className="text-[10px] px-1.5 py-0">
                            {image.format?.toUpperCase() || '?'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Detail Dialog */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Imagem</DialogTitle>
            </DialogHeader>
            {selectedImage && (
              <div className="space-y-4">
                <img
                  src={selectedImage.public_url}
                  alt={selectedImage.article_title}
                  className="w-full rounded-lg"
                />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Artigo:</span>
                    <p className="font-medium">{selectedImage.article_title}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <p className="font-medium">
                      {selectedImage.image_type === 'cover' ? 'Capa' : `Galeria ${selectedImage.image_index + 1}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Formato:</span>
                    <p className="font-medium">{selectedImage.format?.toUpperCase() || 'Desconhecido'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">URL:</span>
                    <p className="font-medium text-xs break-all">{selectedImage.public_url}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => regenerateImage(selectedImage)}
                    disabled={regeneratingId === selectedImage.id}
                  >
                    {regeneratingId === selectedImage.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <AIIcon size="sm" className="mr-2" />
                    )}
                    Regenerar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setImageToDelete(selectedImage);
                      setShowDeleteDialog(true);
                      setSelectedImage(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação irá remover permanentemente a imagem do storage e do banco de dados. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteImage} className="bg-destructive hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Restore Dialog */}
        <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Restaurar Imagens do Backup</DialogTitle>
            </DialogHeader>

            {isLoadingBackups ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !selectedBackupDate ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Selecione uma data de backup para ver os artigos disponíveis:
                </p>
                {backupDates.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Nenhum backup disponível. Execute um backup manual primeiro.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {backupDates.map((date) => (
                      <Button
                        key={date}
                        variant="outline"
                        className="h-auto py-3 flex flex-col"
                        onClick={() => loadBackupArticles(date)}
                      >
                        <Clock className="h-5 w-5 mb-1" />
                        <span>{new Date(date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedBackupDate(null)}
                  >
                    ← Voltar às datas
                  </Button>
                  <Badge variant="outline">
                    {new Date(selectedBackupDate).toLocaleDateString('pt-BR')}
                  </Badge>
                </div>

                {backupArticles.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Nenhum artigo encontrado neste backup.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {backupArticles.map((article) => (
                      <Card key={article.id} className="border-border/50">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{article.title}</CardTitle>
                            <Button
                              size="sm"
                              onClick={() => handleRestore(article.id)}
                              disabled={isRestoring}
                            >
                              {isRestoring ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  Restaurar Tudo
                                </>
                              )}
                            </Button>
                          </div>
                          <CardDescription>
                            {article.images.length} imagem(ns) no backup
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {article.images.map((img) => (
                              <div
                                key={img.path}
                                className="relative group"
                              >
                                <Badge
                                  variant="secondary"
                                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                  onClick={() => handleRestore(article.id, img.type, img.index)}
                                >
                                  {img.type === 'cover' ? 'Capa' : `Galeria ${img.index + 1}`}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

export default function ImagesDashboard() {
  return (
    <PermissionGate permission="can_manage_image_library">
      <ImagesDashboardContent />
    </PermissionGate>
  );
}
