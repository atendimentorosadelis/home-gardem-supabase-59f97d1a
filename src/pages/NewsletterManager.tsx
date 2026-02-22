import { useState, useEffect, useMemo } from 'react';
import {
  Mail, Users, UserCheck, UserX, Trash2, RefreshCw, Search, Download, Loader2,
  Calendar, Send, BarChart3, Eye, MousePointer, CheckCircle, XCircle, Clock,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { AIIcon } from '@/components/AIIcon';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PermissionGate } from '@/components/PermissionGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

interface Subscriber { id: string; email: string; subscribed_at: string; is_active: boolean; source?: string; unsubscribed_at: string | null; }
interface Stats { total: number; active: number; inactive: number; thisMonth: number; }
interface SendHistory { id: string; article_id: string | null; article_title: string; article_slug: string | null; sent_at: string; total_recipients: number; successful_sends: number; failed_sends: number; opened_count: number; clicked_count: number; status: string; error_message: string | null; }

function NewsletterManagerContent() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [subscriberToDelete, setSubscriberToDelete] = useState<Subscriber | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const [autoSendEnabled, setAutoSendEnabled] = useState(false);
  const [loadingAutoSend, setLoadingAutoSend] = useState(true);
  const [savingAutoSend, setSavingAutoSend] = useState(false);
  const [sendHistory, setSendHistory] = useState<SendHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyExpanded, setHistoryExpanded] = useState(true);

  const fetchAutoSendSettings = async () => {
    try {
      const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'newsletter_auto_send').single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data?.value && typeof data.value === 'object') { const config = data.value as { enabled?: boolean }; setAutoSendEnabled(config.enabled ?? false); }
    } catch (error) { console.error('Error fetching auto-send settings:', error); } finally { setLoadingAutoSend(false); }
  };

  const handleToggleAutoSend = async (enabled: boolean) => {
    setSavingAutoSend(true);
    try {
      const { error } = await supabase.from('site_settings').upsert({ key: 'newsletter_auto_send', value: { enabled }, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw error;
      setAutoSendEnabled(enabled);
      toast({ title: enabled ? 'Envio automático ativado' : 'Envio automático desativado', description: enabled ? 'A newsletter será enviada automaticamente quando um novo artigo for publicado.' : 'O envio automático de newsletter foi desativado.' });
    } catch (error) { toast({ title: 'Erro', description: 'Não foi possível salvar a configuração.', variant: 'destructive' }); } finally { setSavingAutoSend(false); }
  };

  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false });
      if (error) throw error;
      const subs = data as Subscriber[];
      setSubscribers(subs);
      const now = new Date(); const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStats({ total: subs.length, active: subs.filter(s => s.is_active).length, inactive: subs.filter(s => !s.is_active).length, thisMonth: subs.filter(s => new Date(s.subscribed_at) >= firstOfMonth).length });
    } catch (error) { toast({ title: 'Erro', description: 'Falha ao carregar inscritos', variant: 'destructive' }); } finally { setIsLoading(false); }
  };

  const fetchSendHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await (supabase as any).from('newsletter_send_history').select('*').order('sent_at', { ascending: false }).limit(20);
      if (error) throw error;
      setSendHistory(data || []);
    } catch (error) { console.error('Error fetching send history:', error); } finally { setLoadingHistory(false); }
  };

  useEffect(() => { fetchSubscribers(); fetchAutoSendSettings(); fetchSendHistory(); }, []);

  const toggleSubscriberStatus = async (subscriber: Subscriber) => {
    try {
      const newStatus = !subscriber.is_active;
      const { error } = await supabase.from('newsletter_subscribers').update({ is_active: newStatus, unsubscribed_at: newStatus ? null : new Date().toISOString() }).eq('id', subscriber.id);
      if (error) throw error;
      toast({ title: newStatus ? 'Inscrito reativado' : 'Inscrito desativado', description: `${subscriber.email} foi ${newStatus ? 'reativado' : 'desativado'} com sucesso.` });
      await fetchSubscribers();
    } catch (error) { toast({ title: 'Erro', description: 'Falha ao atualizar inscrito', variant: 'destructive' }); }
  };

  const deleteSubscriber = async () => {
    if (!subscriberToDelete) return;
    try {
      const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', subscriberToDelete.id);
      if (error) throw error;
      toast({ title: 'Inscrito removido', description: `${subscriberToDelete.email} foi removido da lista.` });
      await fetchSubscribers();
    } catch (error) { toast({ title: 'Erro', description: 'Falha ao remover inscrito', variant: 'destructive' }); } finally { setShowDeleteDialog(false); setSubscriberToDelete(null); }
  };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const activeSubscribers = subscribers.filter(s => s.is_active);
      const csvContent = [['Email', 'Data de Inscrição', 'Fonte', 'Status'].join(','), ...activeSubscribers.map(s => [s.email, new Date(s.subscribed_at).toLocaleDateString('pt-BR'), s.source, s.is_active ? 'Ativo' : 'Inativo'].join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`; link.click();
      toast({ title: 'Exportação concluída', description: `${activeSubscribers.length} inscritos exportados.` });
    } catch (error) { toast({ title: 'Erro', description: 'Falha ao exportar lista', variant: 'destructive' }); } finally { setIsExporting(false); }
  };

  const filteredSubscribers = useMemo(() => subscribers.filter(sub => {
    const matchesSearch = sub.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' && sub.is_active) || (filterStatus === 'inactive' && !sub.is_active);
    return matchesSearch && matchesStatus;
  }), [subscribers, searchQuery, filterStatus]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus]);
  const totalPages = Math.ceil(filteredSubscribers.length / ITEMS_PER_PAGE);
  const paginatedSubscribers = useMemo(() => { const startIndex = (currentPage - 1) * ITEMS_PER_PAGE; return filteredSubscribers.slice(startIndex, startIndex + ITEMS_PER_PAGE); }, [filteredSubscribers, currentPage]);
  const getVisiblePages = (): (number | 'ellipsis')[] => { const pages: (number | 'ellipsis')[] = []; if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); } else { pages.push(1); if (currentPage > 3) pages.push('ellipsis'); const start = Math.max(2, currentPage - 1); const end = Math.min(totalPages - 1, currentPage + 1); for (let i = start; i <= end; i++) pages.push(i); if (currentPage < totalPages - 2) pages.push('ellipsis'); pages.push(totalPages); } return pages; };
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Mail className="h-8 w-8" />Newsletter</h1><p className="text-muted-foreground">Gerencie os inscritos na newsletter</p></div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={fetchSubscribers} disabled={isLoading}><RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />Atualizar</Button>
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={isExporting || isLoading}>{isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}Exportar CSV</Button>
          </div>
        </div>

        <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><AIIcon size="md" />Envio Automático</CardTitle><CardDescription>Envie automaticamente a newsletter para todos os inscritos quando um novo artigo for publicado</CardDescription></CardHeader><CardContent><div className="flex items-center justify-between"><div className="space-y-1"><Label htmlFor="auto-send" className="font-medium">Enviar newsletter ao publicar artigo</Label><p className="text-sm text-muted-foreground">{autoSendEnabled ? `Ativo - ${stats?.active || 0} inscritos receberão novidades automaticamente` : 'Desativado - novos artigos não dispararão envio de newsletter'}</p></div><div className="flex items-center gap-2">{(loadingAutoSend || savingAutoSend) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}<Switch id="auto-send" checked={autoSendEnabled} onCheckedChange={handleToggleAutoSend} disabled={loadingAutoSend || savingAutoSend} /></div></div></CardContent></Card>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Inscritos</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent>{isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats?.total || 0}</div>}</CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ativos</CardTitle><UserCheck className="h-4 w-4 text-primary" /></CardHeader><CardContent>{isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-primary">{stats?.active || 0}</div>}</CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Inativos</CardTitle><UserX className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent>{isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-muted-foreground">{stats?.inactive || 0}</div>}</CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Este Mês</CardTitle><Calendar className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent>{isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats?.thisMonth || 0}</div>}</CardContent></Card>
        </div>

        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setHistoryExpanded(!historyExpanded)}>
            <div className="flex items-center justify-between"><div><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5" />Histórico de Envios</CardTitle><CardDescription>Estatísticas de entrega, abertura e cliques das newsletters enviadas</CardDescription></div><div className="flex items-center gap-2"><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); fetchSendHistory(); }}><RefreshCw className={`h-4 w-4 ${loadingHistory ? 'animate-spin' : ''}`} /></Button>{historyExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}</div></div>
          </CardHeader>
          {historyExpanded && (
            <CardContent>
              {loadingHistory ? <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : sendHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground"><Send className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>Nenhum envio de newsletter registrado</p></div>
              ) : (
                <div className="space-y-3">{sendHistory.map((history) => {
                  const openRate = history.successful_sends > 0 ? Math.round((history.opened_count / history.successful_sends) * 100) : 0;
                  return (
                    <div key={history.id} className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1">{history.status === 'completed' ? <CheckCircle className="h-4 w-4 text-primary shrink-0" /> : history.status === 'failed' ? <XCircle className="h-4 w-4 text-destructive shrink-0" /> : <Clock className="h-4 w-4 text-muted-foreground shrink-0" />}<h4 className="font-medium truncate">{history.article_title}</h4></div><p className="text-xs text-muted-foreground">{new Date(history.sent_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div>
                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div><div className="flex items-center justify-center gap-1 text-sm font-medium"><Send className="h-3 w-3 text-muted-foreground" />{history.successful_sends}</div><p className="text-xs text-muted-foreground">Enviados</p></div>
                          <div><div className="flex items-center justify-center gap-1 text-sm font-medium"><Eye className="h-3 w-3 text-muted-foreground" />{history.opened_count}</div><p className="text-xs text-muted-foreground">Aberturas</p></div>
                          <div><div className="flex items-center justify-center gap-1 text-sm font-medium"><MousePointer className="h-3 w-3 text-muted-foreground" />{history.clicked_count}</div><p className="text-xs text-muted-foreground">Cliques</p></div>
                          <div><div className="text-sm font-medium text-primary">{openRate}%</div><p className="text-xs text-muted-foreground">Taxa Abertura</p></div>
                        </div>
                      </div>
                      {history.error_message && <div className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded">{history.error_message}</div>}
                      {history.failed_sends > 0 && <div className="mt-2 text-xs text-destructive">{history.failed_sends} envio(s) falhou(aram)</div>}
                    </div>
                  );
                })}</div>
              )}
            </CardContent>
          )}
        </Card>

        <Card><CardHeader><CardTitle className="text-lg">Filtros</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-4"><div className="flex-1 min-w-[200px]"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por e-mail..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div></div><Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}><SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="active">Ativos</SelectItem><SelectItem value="inactive">Inativos</SelectItem></SelectContent></Select></div></CardContent></Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Inscritos ({filteredSubscribers.length})</CardTitle><CardDescription>Lista de todos os inscritos na newsletter</CardDescription></CardHeader>
          <CardContent>
            {isLoading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> : filteredSubscribers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><Mail className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Nenhum inscrito encontrado</p></div>
            ) : (
              <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>E-mail</TableHead><TableHead>Data</TableHead><TableHead>Fonte</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{paginatedSubscribers.map((subscriber) => (
                <TableRow key={subscriber.id}><TableCell className="font-medium">{subscriber.email}</TableCell><TableCell className="text-muted-foreground">{formatDate(subscriber.subscribed_at)}</TableCell><TableCell><Badge variant="outline">{subscriber.source}</Badge></TableCell><TableCell><Badge variant={subscriber.is_active ? 'default' : 'secondary'}>{subscriber.is_active ? 'Ativo' : 'Inativo'}</Badge></TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => toggleSubscriberStatus(subscriber)}>{subscriber.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}</Button><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => { setSubscriberToDelete(subscriber); setShowDeleteDialog(true); }}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>
              ))}</TableBody></Table></div>
            )}
            {!isLoading && totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredSubscribers.length)} de {filteredSubscribers.length} inscritos</p>
                <Pagination><PaginationContent><PaginationItem><PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} /></PaginationItem>{getVisiblePages().map((page, index) => <PaginationItem key={index}>{page === 'ellipsis' ? <PaginationEllipsis /> : <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">{page}</PaginationLink>}</PaginationItem>)}<PaginationItem><PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} /></PaginationItem></PaginationContent></Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remover inscrito?</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja remover <strong>{subscriberToDelete?.email}</strong> da lista de newsletter? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={deleteSubscriber} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      </div>
    </DashboardLayout>
  );
}

export default function NewsletterManager() {
  return (
    <PermissionGate permission="can_manage_newsletter">
      <NewsletterManagerContent />
    </PermissionGate>
  );
}
