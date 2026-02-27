import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PermissionGate } from '@/components/PermissionGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useImageApproval } from '@/contexts/ImageApprovalContext';
import { createNotificationForAdmins } from '@/hooks/use-notifications';
import { useSendNewsletter } from '@/hooks/use-send-newsletter';
import {
  MoreHorizontal, Search, Loader2, Eye, Pencil, Trash2, Globe, FileText,
  ExternalLink, ChevronLeft, ChevronRight, ImageIcon, Settings2, MessageSquarePlus, Heart, ArrowUpDown, DatabaseIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { invokeEdgeFunction } from '@/lib/edge-functions';

interface Article {
  id: string;
  title: string;
  slug: string | null;
  category: string | null;
  category_slug: string | null;
  status: string | null;
  published_at: string | null;
  created_at: string | null;
  excerpt: string | null;
  cover_image: string | null;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50];

function ArticlesManagerContent() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteArticle, setDeleteArticle] = useState<Article | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<'views' | 'date' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [generatingFaqForId, setGeneratingFaqForId] = useState<string | null>(null);
  const [generatingConclusionForId, setGeneratingConclusionForId] = useState<string | null>(null);
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const { requireApproval, setRequireApproval } = useImageApproval();
  const { sendNewsletterIfEnabled } = useSendNewsletter();
  const queryClient = useQueryClient();

  const handleMigrateArticles = async () => {
    setIsMigrating(true);
    try {
      const { data: result, error } = await invokeEdgeFunction('migrate-articles', {}, true);
      if (error) throw error;
      if (result?.success) {
        toast.success(`Migração concluída! ${result.migrated} artigos migrados, ${result.skipped} ignorados.${result.conclusionsMigrated ? ` ${result.conclusionsMigrated} conclusões.` : ''}${result.videosMigrated ? ` ${result.videosMigrated} vídeos.` : ''}`);
        queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      } else {
        toast.error(`Erro: ${result?.error || 'Desconhecido'}`);
      }
    } catch (err) {
      toast.error('Erro ao executar migração');
      console.error(err);
    } finally {
      setIsMigrating(false);
    }
  };

  const { data: articlesData, isLoading } = useQuery({
    queryKey: ['admin-articles', currentPage, itemsPerPage, searchQuery, statusFilter],
    queryFn: async () => {
      let countQuery = (supabase as any)
        .from('content_articles')
        .select('*', { count: 'exact', head: true });

      if (searchQuery) {
        countQuery = countQuery.or(`title.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
      }
      if (statusFilter !== 'all') {
        countQuery = countQuery.eq('status', statusFilter);
      }

      const { count } = await countQuery;

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let dataQuery = (supabase as any)
        .from('content_articles')
        .select('id, title, slug, category, category_slug, status, published_at, created_at, excerpt, cover_image')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (searchQuery) {
        dataQuery = dataQuery.or(`title.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
      }
      if (statusFilter !== 'all') {
        dataQuery = dataQuery.eq('status', statusFilter);
      }

      const { data, error } = await dataQuery;
      if (error) throw error;

      const articleIds = (data || []).map((a: any) => a.id);
      let viewCounts: Record<string, number> = {};

      if (articleIds.length > 0) {
        const { data: viewsData } = await (supabase as any)
          .from('article_views')
          .select('article_id')
          .in('article_id', articleIds);

        (viewsData || []).forEach((view: any) => {
          viewCounts[view.article_id] = (viewCounts[view.article_id] || 0) + 1;
        });
      }

      return {
        articles: data as Article[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / itemsPerPage),
        viewCounts,
      };
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, title, article }: { id: string; status: string; title?: string; article?: Article }) => {
      const updates: { status: string; published_at?: string | null } = { status };
      if (status === 'published') {
        updates.published_at = new Date().toISOString();
      } else {
        updates.published_at = null;
      }

      const { error } = await (supabase as any)
        .from('content_articles')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      if (status === 'published' && title) {
        await createNotificationForAdmins(
          'Novo artigo publicado!',
          `O artigo "${title}" foi publicado com sucesso.`,
          'article',
          `/blog`
        );

        if (article && article.slug) {
          await sendNewsletterIfEnabled({
            id: article.id,
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt,
            category: article.category,
            cover_image: article.cover_image,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: () => { toast.error('Erro ao atualizar status'); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('content_articles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      toast.success('Artigo excluído com sucesso!');
      setDeleteArticle(null);
    },
    onError: () => { toast.error('Erro ao excluir artigo'); },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await (supabase as any).from('content_articles').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      const count = selectedArticles.size;
      toast.success(`${count} artigo${count > 1 ? 's' : ''} excluído${count > 1 ? 's' : ''} com sucesso!`);
      setSelectedArticles(new Set());
      setShowBulkDeleteDialog(false);
    },
    onError: () => { toast.error('Erro ao excluir artigos'); },
  });

  const generateFAQMutation = useMutation({
    mutationFn: async (articleId: string) => {
      setGeneratingFaqForId(articleId);
      const { data, error } = await invokeEdgeFunction('generate-faq', { articleId });
      if (error) throw error;
      if (!data?.success) {
        if (data?.alreadyExists) throw new Error('Este artigo já possui uma seção de FAQ');
        throw new Error(data?.error || 'Erro ao gerar FAQ');
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      toast.success(data?.usedFallback ? 'FAQ gerado com sucesso (modelo padrão)' : 'FAQ gerado e adicionado ao artigo!');
    },
    onError: (error: Error) => { toast.error(error.message || 'Erro ao gerar FAQ'); },
    onSettled: () => { setGeneratingFaqForId(null); },
  });

  const generateConclusionMutation = useMutation({
    mutationFn: async (articleId: string) => {
      setGeneratingConclusionForId(articleId);
      const { data: article, error: articleError } = await (supabase as any)
        .from('content_articles')
        .select('title, main_subject')
        .eq('id', articleId)
        .single();

      if (articleError || !article) throw new Error('Artigo não encontrado');

      const theme = article.title || article.main_subject || 'Artigo';
      const { data, error } = await invokeEdgeFunction<{ emotional_text: string; error?: string }>('generate-emotional-conclusion', { theme });
      if (error) throw error;
      if (!data?.emotional_text) throw new Error(data?.error || 'Erro ao gerar conclusão emocional');

      const { error: saveError } = await (supabase as any)
        .from('article_emotional_conclusions')
        .upsert({
          article_id: articleId,
          conclusion_text: data.emotional_text,
          generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'article_id' });

      if (saveError) throw new Error('Conclusão gerada, mas erro ao salvar');
      return { emotional_text: data.emotional_text };
    },
    onSuccess: () => { toast.success('Conclusão emocional gerada com sucesso!'); },
    onError: (error: Error) => { toast.error(error.message || 'Erro ao gerar conclusão emocional'); },
    onSettled: () => { setGeneratingConclusionForId(null); },
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "dd MMM yyyy", { locale: ptBR });
  };

  const getArticleUrl = (article: Article) => {
    if (article.category_slug && article.slug) return `/${article.category_slug}/${article.slug}`;
    return null;
  };

  const handleSearchChange = (value: string) => { setSearchQuery(value); setCurrentPage(1); };
  const handleItemsPerPageChange = (value: string) => { setItemsPerPage(Number(value)); setCurrentPage(1); };
  const handleStatusFilterChange = (value: string) => { setStatusFilter(value); setCurrentPage(1); };

  const handleSelectArticle = (articleId: string, checked: boolean) => {
    const newSelected = new Set(selectedArticles);
    if (checked) newSelected.add(articleId);
    else newSelected.delete(articleId);
    setSelectedArticles(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedArticles(new Set(articles.map((a) => a.id)));
    else setSelectedArticles(new Set());
  };

  const rawArticles = articlesData?.articles || [];
  const viewCounts = articlesData?.viewCounts || {};
  const totalCount = articlesData?.totalCount || 0;
  const totalPages = articlesData?.totalPages || 1;

  const handleSort = (field: 'views' | 'date') => {
    if (sortField === field) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('desc'); }
  };

  const articles = sortField
    ? [...rawArticles].sort((a, b) => {
        let comparison = 0;
        if (sortField === 'views') comparison = (viewCounts[a.id] || 0) - (viewCounts[b.id] || 0);
        else if (sortField === 'date') {
          const dateA = new Date(a.published_at || a.created_at || 0).getTime();
          const dateB = new Date(b.published_at || b.created_at || 0).getTime();
          comparison = dateA - dateB;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      })
    : rawArticles;

  const allSelected = articles.length > 0 && articles.every((a) => selectedArticles.has(a.id));
  const someSelected = articles.some((a) => selectedArticles.has(a.id));
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <DashboardLayout>
       <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Artigos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie todos os artigos do site</p>
        </div>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Configurações de Geração</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <ImageIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <Label htmlFor="approval-toggle" className="font-medium">Aprovação de Imagens</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">Revise e aprove cada imagem antes de salvar</p>
                </div>
              </div>
              <Switch id="approval-toggle" checked={requireApproval} onCheckedChange={setRequireApproval} className="shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* Migration Button */}
        <Card className="border-border/50">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm">Migrar Artigos do Supabase Antigo</p>
                <p className="text-xs text-muted-foreground">Importa artigos, conclusões e vídeos. Duplicados ignorados.</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleMigrateArticles} disabled={isMigrating} className="shrink-0 w-full sm:w-auto">
                {isMigrating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <DatabaseIcon className="h-4 w-4 mr-2" />}
                {isMigrating ? 'Migrando...' : 'Migrar Artigos'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Todos os Artigos</CardTitle>
                <CardDescription>
                  {totalCount} artigos no total
                  {selectedArticles.size > 0 && (
                    <span className="ml-2 text-primary font-medium">• {selectedArticles.size} selecionado{selectedArticles.size > 1 ? 's' : ''}</span>
                  )}
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                {selectedArticles.size > 0 && (
                  <Button variant="destructive" size="sm" onClick={() => setShowBulkDeleteDialog(true)} className="shrink-0">
                    <Trash2 className="h-4 w-4 mr-2" />Excluir ({selectedArticles.size})
                  </Button>
                )}
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="published">Publicados</SelectItem>
                    <SelectItem value="draft">Rascunhos</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar artigos..." value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} className="pl-9" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : articles.length > 0 ? (
              <>
                <div className="hidden md:block rounded-md border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[35%]">Título</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" className="h-8 -ml-3 hover:bg-transparent gap-1" onClick={() => handleSort('views')}>
                            Views<ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'views' ? 'text-primary' : 'text-muted-foreground'}`} />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" className="h-8 -ml-3 hover:bg-transparent gap-1" onClick={() => handleSort('date')}>
                            Data<ArrowUpDown className={`h-3.5 w-3.5 ${sortField === 'date' ? 'text-primary' : 'text-muted-foreground'}`} />
                          </Button>
                        </TableHead>
                        <TableHead className="w-[50px]">
                          <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} aria-label="Selecionar todos" />
                        </TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {articles.map((article) => (
                        <TableRow key={article.id} className={selectedArticles.has(article.id) ? 'bg-primary/5' : ''}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium line-clamp-1">{article.title}</span>
                              {article.excerpt && <span className="text-xs text-muted-foreground line-clamp-1">{article.excerpt}</span>}
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{article.category || 'Sem categoria'}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={article.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                              {article.status === 'published' ? <><Globe className="h-3 w-3 mr-1" /> Publicado</> : <><FileText className="h-3 w-3 mr-1" /> Rascunho</>}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground"><Eye className="h-3.5 w-3.5" /><span>{viewCounts[article.id] || 0}</span></div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(article.published_at || article.created_at)}</TableCell>
                          <TableCell>
                            <Checkbox checked={selectedArticles.has(article.id)} onCheckedChange={(checked) => handleSelectArticle(article.id, !!checked)} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/articles/${article.id}`)} title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {getArticleUrl(article) && (
                                    <DropdownMenuItem asChild>
                                      <a href={getArticleUrl(article)!} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                        <Eye className="h-4 w-4 mr-2" />Visualizar<ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                                      </a>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => navigate(`/admin/articles/${article.id}`)}><Pencil className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => generateFAQMutation.mutate(article.id)} disabled={generatingFaqForId === article.id}>
                                    {generatingFaqForId === article.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquarePlus className="h-4 w-4 mr-2" />}Gerar FAQ
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => generateConclusionMutation.mutate(article.id)} disabled={generatingConclusionForId === article.id}>
                                    {generatingConclusionForId === article.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Heart className="h-4 w-4 mr-2" />}Gerar Conclusão Emocional
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {article.status === 'published' ? (
                                    <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: article.id, status: 'draft' })}><FileText className="h-4 w-4 mr-2" />Despublicar</DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: article.id, status: 'published', title: article.title, article })}><Globe className="h-4 w-4 mr-2" />Publicar</DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteArticle(article)}><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {articles.map((article) => (
                    <div key={article.id} className={`border rounded-lg p-3 bg-card space-y-2 ${selectedArticles.has(article.id) ? 'border-primary/50 bg-primary/5' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/admin/articles/${article.id}`)}>
                          <p className="font-medium text-sm line-clamp-2">{article.title}</p>
                          {article.excerpt && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{article.excerpt}</p>}
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/admin/articles/${article.id}`)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {getArticleUrl(article) && (
                                <DropdownMenuItem asChild>
                                  <a href={getArticleUrl(article)!} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                    <Eye className="h-4 w-4 mr-2" />Visualizar<ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => navigate(`/admin/articles/${article.id}`)}><Pencil className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => generateFAQMutation.mutate(article.id)} disabled={generatingFaqForId === article.id}>
                                {generatingFaqForId === article.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquarePlus className="h-4 w-4 mr-2" />}Gerar FAQ
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => generateConclusionMutation.mutate(article.id)} disabled={generatingConclusionForId === article.id}>
                                {generatingConclusionForId === article.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Heart className="h-4 w-4 mr-2" />}Gerar Conclusão
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {article.status === 'published' ? (
                                <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: article.id, status: 'draft' })}><FileText className="h-4 w-4 mr-2" />Despublicar</DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: article.id, status: 'published', title: article.title, article })}><Globe className="h-4 w-4 mr-2" />Publicar</DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteArticle(article)}><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{article.category || 'Sem categoria'}</Badge>
                          <Badge variant={article.status === 'published' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                            {article.status === 'published' ? 'Publicado' : 'Rascunho'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Eye className="h-3 w-3" />{viewCounts[article.id] || 0}</span>
                          <span className="text-[10px] text-muted-foreground">{formatDate(article.published_at || article.created_at)}</span>
                        </div>
                        <Checkbox checked={selectedArticles.has(article.id)} onCheckedChange={(checked) => handleSelectArticle(article.id, !!checked)} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex flex-col items-center gap-3 mt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Exibindo</span>
                    <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                      <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={String(option)}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>de {totalCount} ({startItem}-{endItem})</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 px-2 sm:px-3">
                      <ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline">Anterior</span>
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;
                        return (
                          <Button key={pageNum} variant={currentPage === pageNum ? 'default' : 'outline'} size="sm" className="w-8 h-8 p-0" onClick={() => setCurrentPage(pageNum)}>
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 px-2 sm:px-3">
                      <span className="hidden sm:inline">Próximo</span><ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <p>Nenhum artigo encontrado</p>
                {searchQuery && <Button variant="link" onClick={() => handleSearchChange('')} className="mt-2">Limpar busca</Button>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteArticle} onOpenChange={() => setDeleteArticle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir artigo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O artigo "{deleteArticle?.title}" será permanentemente removido do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteArticle && deleteMutation.mutate(deleteArticle.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedArticles.size} artigo{selectedArticles.size > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Os artigos selecionados serão permanentemente removidos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => bulkDeleteMutation.mutate(Array.from(selectedArticles))} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {bulkDeleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : `Excluir ${selectedArticles.size}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

export default function ArticlesManager() {
  return (
    <PermissionGate permission="can_manage_articles">
      <ArticlesManagerContent />
    </PermissionGate>
  );
}
