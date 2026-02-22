import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PermissionGate } from '@/components/PermissionGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MessageSquare, Search, RefreshCw, Trash2, Eye, Mail, Clock, CheckCircle, MessageCircle, Inbox, Send, Loader2, ChevronDown, History, User, FileText } from 'lucide-react';
import { AIIcon } from '@/components/AIIcon';
import { supabase } from '@/lib/supabase';
import { invokeEdgeFunction, EDGE_FUNCTIONS } from '@/lib/edge-functions';
import { useToast } from '@/hooks/use-toast';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContactMessage { id: string; name: string; email: string; subject: string; message: string; status: string; created_at: string; updated_at: string; }
interface MessageReply { id: string; message_id: string; reply_text: string; replied_by: string; replied_at: string; is_ai_generated: boolean; sent_via_email: boolean; }
interface ReplyTemplate { id: string; title: string; content: string; category: string; }
interface Stats { total: number; pending: number; read: number; replied: number; [key: string]: number; }

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock },
  read: { label: 'Lido', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Eye },
  replied: { label: 'Respondido', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle },
};

const subjectLabels: Record<string, string> = { question: 'Dúvida sobre conteúdo', suggestion: 'Sugestão de artigo', partnership: 'Parceria/Colaboração', problem: 'Reportar problema', other: 'Outro' };

function ContactMessagesManagerContent() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, read: 0, replied: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<ContactMessage | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();
  const { playNotificationSound } = useNotificationSound();
  const [replyText, setReplyText] = useState('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [messageReplies, setMessageReplies] = useState<MessageReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [loadingAutoReply, setLoadingAutoReply] = useState(true);
  const [savingAutoReply, setSavingAutoReply] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await invokeEdgeFunction<{ messages: ContactMessage[], count: number }>(EDGE_FUNCTIONS.MANAGE_CONTACT_MESSAGES, { action: 'list' });
      if (error) throw error;
      const messagesData = data?.messages || [];
      setMessages(messagesData);
      setStats({ total: messagesData.length, pending: messagesData.filter(m => m.status === 'pending').length, read: messagesData.filter(m => m.status === 'read').length, replied: messagesData.filter(m => m.status === 'replied').length });
    } catch (error) { toast({ title: 'Erro', description: 'Não foi possível carregar as mensagens.', variant: 'destructive' }); } finally { setLoading(false); }
  };

  const fetchReplies = async (messageId: string) => {
    setLoadingReplies(true);
    try { const { data, error } = await (supabase as any).from('contact_message_replies').select('*').eq('message_id', messageId).order('replied_at', { ascending: false }); if (error) throw error; setMessageReplies(data || []); }
    catch (error) { console.error('Error fetching replies:', error); } finally { setLoadingReplies(false); }
  };

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try { const { data, error } = await (supabase as any).from('contact_reply_templates').select('id, title, content, category').eq('is_active', true).order('title'); if (error) throw error; setTemplates(data || []); }
    catch (error) { console.error('Error fetching templates:', error); } finally { setLoadingTemplates(false); }
  };

  const fetchAutoReplySettings = async () => {
    try {
      const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'auto_reply_config').single();
      if (error && error.code !== 'PGRST116') console.error('Error loading auto-reply settings:', error);
      if (data?.value && typeof data.value === 'object' && !Array.isArray(data.value)) { const value = data.value as { enabled?: boolean }; setAutoReplyEnabled(value.enabled ?? false); }
    } catch (error) { console.error('Error loading auto-reply settings:', error); } finally { setLoadingAutoReply(false); }
  };

  const handleToggleAutoReply = async (enabled: boolean) => {
    setSavingAutoReply(true);
    try {
      const { data: currentData } = await supabase.from('site_settings').select('value').eq('key', 'auto_reply_config').single();
      const currentValue = (currentData?.value && typeof currentData.value === 'object' && !Array.isArray(currentData.value)) ? currentData.value as { enabled?: boolean; prompt?: string } : { prompt: 'Você é um assistente do site Home Garden Manual.' };
      const { error } = await supabase.from('site_settings').update({ value: { ...currentValue, enabled }, updated_at: new Date().toISOString() }).eq('key', 'auto_reply_config');
      if (error) throw error;
      setAutoReplyEnabled(enabled);
      toast({ title: enabled ? 'Resposta automática ativada' : 'Resposta automática desativada', description: enabled ? 'A IA agora responderá automaticamente às novas mensagens.' : 'As mensagens serão aguardando sua resposta manual.' });
    } catch (error) { toast({ title: 'Erro', description: 'Não foi possível salvar a configuração.', variant: 'destructive' }); } finally { setSavingAutoReply(false); }
  };

  useEffect(() => {
    fetchMessages(); fetchTemplates(); fetchAutoReplySettings();
    const channel = supabase.channel('contact-messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contact_messages' }, (payload) => {
        const newMessage = payload.new as ContactMessage;
        setMessages(prev => [newMessage, ...prev]);
        setStats(prev => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));
        playNotificationSound();
        toast({ title: '📬 Nova mensagem de contato!', description: `${newMessage.name}: ${newMessage.subject}` });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contact_messages' }, (payload) => { const updatedMessage = payload.new as ContactMessage; setMessages(prev => prev.map(m => m.id === updatedMessage.id ? updatedMessage : m)); })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'contact_messages' }, (payload) => { setMessages(prev => prev.filter(m => m.id !== payload.old.id)); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [toast, playNotificationSound]);

  const updateMessageStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await invokeEdgeFunction(EDGE_FUNCTIONS.MANAGE_CONTACT_MESSAGES, { action: 'update_status', id, status: newStatus });
      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
      const oldStatus = messages.find(m => m.id === id)?.status || '';
      setStats(prev => ({ ...prev, [oldStatus]: prev[oldStatus] - 1, [newStatus]: prev[newStatus] + 1 }));
      toast({ title: 'Status atualizado', description: `Mensagem marcada como "${statusConfig[newStatus as keyof typeof statusConfig]?.label}".` });
    } catch (error) { toast({ title: 'Erro', description: 'Não foi possível atualizar o status.', variant: 'destructive' }); }
  };

  const deleteMessage = async () => {
    if (!messageToDelete) return;
    try {
      const { error } = await invokeEdgeFunction(EDGE_FUNCTIONS.MANAGE_CONTACT_MESSAGES, { action: 'delete', id: messageToDelete.id });
      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== messageToDelete.id));
      setStats(prev => ({ ...prev, total: prev.total - 1, [messageToDelete.status]: prev[messageToDelete.status] - 1 }));
      toast({ title: 'Mensagem excluída', description: 'A mensagem foi removida com sucesso.' });
    } catch (error) { toast({ title: 'Erro', description: 'Não foi possível excluir a mensagem.', variant: 'destructive' }); } finally { setMessageToDelete(null); }
  };

  const handleViewMessage = async (message: ContactMessage) => {
    setSelectedMessage(message); setReplyText(''); setMessageReplies([]); setRepliesOpen(false);
    if (message.status === 'pending') await updateMessageStatus(message.id, 'read');
    fetchReplies(message.id);
  };

  const handleGenerateAIReply = async () => {
    if (!selectedMessage) return;
    setIsGeneratingReply(true);
    try {
      const { data, error } = await invokeEdgeFunction('generate-ai-reply', { message_id: selectedMessage.id, name: selectedMessage.name, email: selectedMessage.email, subject: subjectLabels[selectedMessage.subject] || selectedMessage.subject, message: selectedMessage.message });
      if (error) throw error;
      if (data?.reply) { setReplyText(data.reply); toast({ title: 'Resposta gerada!', description: 'A IA gerou uma sugestão de resposta.' }); }
      else throw new Error('No reply generated');
    } catch (error: any) { toast({ title: 'Erro ao gerar resposta', description: error.message || 'Não foi possível gerar a resposta com IA.', variant: 'destructive' }); } finally { setIsGeneratingReply(false); }
  };

  const handleSendReply = async (sendEmail: boolean) => {
    if (!selectedMessage || !replyText.trim()) { toast({ title: 'Erro', description: 'Digite uma resposta antes de enviar.', variant: 'destructive' }); return; }
    setIsSendingReply(true);
    try {
      const { data, error } = await invokeEdgeFunction('reply-contact-message', { message_id: selectedMessage.id, reply_text: replyText, send_email: sendEmail, is_ai_generated: false, recipient_email: selectedMessage.email, recipient_name: selectedMessage.name, original_subject: subjectLabels[selectedMessage.subject] || selectedMessage.subject, original_message: selectedMessage.message });
      if (error) throw error;
      toast({ title: 'Resposta enviada!', description: data?.message || 'Sua resposta foi salva com sucesso.' });
      setMessages(prev => prev.map(m => m.id === selectedMessage.id ? { ...m, status: 'replied' } : m));
      setSelectedMessage(prev => prev ? { ...prev, status: 'replied' } : null);
      fetchReplies(selectedMessage.id); setReplyText('');
    } catch (error: any) { toast({ title: 'Erro ao enviar resposta', description: error.message || 'Não foi possível enviar a resposta.', variant: 'destructive' }); } finally { setIsSendingReply(false); }
  };

  const filteredMessages = useMemo(() => messages.filter(message => {
    const matchesSearch = message.name.toLowerCase().includes(searchQuery.toLowerCase()) || message.email.toLowerCase().includes(searchQuery.toLowerCase()) || message.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [messages, searchQuery, statusFilter]);

  const paginatedMessages = useMemo(() => { const start = (currentPage - 1) * itemsPerPage; return filteredMessages.slice(start, start + itemsPerPage); }, [filteredMessages, currentPage]);
  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);
  const formatDate = (dateStr: string) => format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div><h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><MessageSquare className="h-6 w-6 text-primary" />Mensagens de Contato</h1><p className="text-muted-foreground mt-1">Gerencie as mensagens recebidas pelo formulário de contato.</p></div>
            <Button onClick={fetchMessages} variant="outline" disabled={loading}><RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Atualizar</Button>
          </div>
          <Card className={`border-2 transition-colors ${autoReplyEnabled ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
            <CardContent className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${autoReplyEnabled ? 'bg-primary/20' : 'bg-muted'}`}><AIIcon size="md" className={autoReplyEnabled ? '' : 'opacity-50'} /></div><div><Label className="text-base font-medium flex items-center gap-2">Resposta Automática com IA{autoReplyEnabled && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20"><AIIcon size="xs" className="mr-1" />Ativa</Badge>}</Label><p className="text-sm text-muted-foreground">{autoReplyEnabled ? 'A IA está respondendo automaticamente às novas mensagens por e-mail.' : 'Ative para que a IA responda automaticamente às mensagens recebidas.'}</p></div></div><div className="flex items-center gap-2">{savingAutoReply && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}<Switch checked={autoReplyEnabled} onCheckedChange={handleToggleAutoReply} disabled={loadingAutoReply || savingAutoReply} /></div></div></CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Inbox className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-10" /> : stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-yellow-500/10"><Clock className="h-5 w-5 text-yellow-500" /></div><div><p className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-10" /> : stats.pending}</p><p className="text-xs text-muted-foreground">Pendentes</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><Eye className="h-5 w-5 text-blue-500" /></div><div><p className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-10" /> : stats.read}</p><p className="text-xs text-muted-foreground">Lidas</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/10"><CheckCircle className="h-5 w-5 text-green-500" /></div><div><p className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-10" /> : stats.replied}</p><p className="text-xs text-muted-foreground">Respondidas</p></div></CardContent></Card>
        </div>

        <Card><CardContent className="p-4"><div className="flex flex-col sm:flex-row gap-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por nome, e-mail ou assunto..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="pl-10" /></div><Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filtrar por status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem><SelectItem value="pending">Pendente</SelectItem><SelectItem value="read">Lido</SelectItem><SelectItem value="replied">Respondido</SelectItem></SelectContent></Select></div></CardContent></Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Mensagens</CardTitle><CardDescription>{filteredMessages.length} mensagem(ns) encontrada(s)</CardDescription></CardHeader>
          <CardContent>
            {loading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div> : paginatedMessages.length === 0 ? (
              <div className="text-center py-12"><MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" /><p className="text-muted-foreground">Nenhuma mensagem encontrada.</p></div>
            ) : (
              <>
                <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Remetente</TableHead><TableHead>Assunto</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{paginatedMessages.map((message) => {
                  const status = statusConfig[message.status as keyof typeof statusConfig] || statusConfig.pending;
                  const StatusIcon = status.icon; const isPending = message.status === 'pending';
                  return (
                    <TableRow key={message.id} className={cn(isPending && 'bg-yellow-500/5 hover:bg-yellow-500/10', 'cursor-pointer')} onClick={() => handleViewMessage(message)}>
                      <TableCell><div className="flex items-center gap-2">{isPending && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span></span>}<div><p className={cn("font-medium", isPending && "font-semibold")}>{message.name}</p><p className="text-sm text-muted-foreground">{message.email}</p></div></div></TableCell>
                      <TableCell><p className={cn("max-w-[200px] truncate", isPending && "font-medium")}>{subjectLabels[message.subject] || message.subject}</p></TableCell>
                      <TableCell><Badge variant="outline" className={status.color}><StatusIcon className={cn("h-3 w-3 mr-1", isPending && "animate-pulse")} />{status.label}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(message.created_at)}</TableCell>
                      <TableCell className="text-right"><div className="flex items-center justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => handleViewMessage(message)}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setMessageToDelete(message)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                    </TableRow>
                  );
                })}</TableBody></Table></div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Mostrando {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredMessages.length)} de {filteredMessages.length}</p>
                  {totalPages > 1 && <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>Primeira</Button><Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button><div className="flex items-center gap-1">{Array.from({ length: Math.min(5, totalPages) }, (_, i) => { let pageNum: number; if (totalPages <= 5) pageNum = i + 1; else if (currentPage <= 3) pageNum = i + 1; else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i; else pageNum = currentPage - 2 + i; return <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" className="w-8 h-8 p-0" onClick={() => setCurrentPage(pageNum)}>{pageNum}</Button>; })}</div><Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Próxima</Button><Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Última</Button></div>}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedMessage && (
              <>
                <DialogHeader><DialogTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" />Mensagem de {selectedMessage.name}</DialogTitle><DialogDescription>Recebida em {formatDate(selectedMessage.created_at)}</DialogDescription></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4"><div><p className="text-sm font-medium text-muted-foreground">E-mail</p><p className="text-foreground">{selectedMessage.email}</p></div><div><p className="text-sm font-medium text-muted-foreground">Assunto</p><p className="text-foreground">{subjectLabels[selectedMessage.subject] || selectedMessage.subject}</p></div></div>
                  <div><p className="text-sm font-medium text-muted-foreground mb-2">Mensagem</p><div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap">{selectedMessage.message}</div></div>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-sm font-medium">Sua Resposta</p>
                      <div className="flex items-center gap-2">
                        <Select onValueChange={(templateId) => { const template = templates.find(t => t.id === templateId); if (template && selectedMessage) { setReplyText(template.content.replace(/\{nome\}/g, selectedMessage.name)); toast({ title: 'Template aplicado' }); } }}><SelectTrigger className="w-[180px]"><FileText className="h-4 w-4 mr-2" /><SelectValue placeholder="Usar template" /></SelectTrigger><SelectContent>{loadingTemplates ? <div className="p-2 text-center text-sm text-muted-foreground">Carregando...</div> : templates.length === 0 ? <div className="p-2 text-center text-sm text-muted-foreground">Nenhum template</div> : templates.map((template) => <SelectItem key={template.id} value={template.id}>{template.title}</SelectItem>)}</SelectContent></Select>
                        <Button variant="outline" size="sm" onClick={handleGenerateAIReply} disabled={isGeneratingReply}>{isGeneratingReply ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AIIcon size="sm" className="mr-2" />}Gerar com IA</Button>
                      </div>
                    </div>
                    <Textarea placeholder="Digite sua resposta aqui ou use a IA para gerar uma sugestão..." value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={6} className="resize-none" />
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Status:</span><Select value={selectedMessage.status} onValueChange={(value) => { updateMessageStatus(selectedMessage.id, value); setSelectedMessage(prev => prev ? { ...prev, status: value } : null); }}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pendente</SelectItem><SelectItem value="read">Lido</SelectItem><SelectItem value="replied">Respondido</SelectItem></SelectContent></Select></div>
                      <div className="flex items-center gap-2"><Button variant="outline" onClick={() => handleSendReply(false)} disabled={isSendingReply || !replyText.trim()}>{isSendingReply ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Salvar Rascunho</Button><Button onClick={() => handleSendReply(true)} disabled={isSendingReply || !replyText.trim()}>{isSendingReply ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}Enviar por E-mail</Button></div>
                    </div>
                  </div>
                  {messageReplies.length > 0 && (
                    <Collapsible open={repliesOpen} onOpenChange={setRepliesOpen}>
                      <CollapsibleTrigger asChild><Button variant="ghost" className="w-full justify-between"><span className="flex items-center gap-2"><History className="h-4 w-4" />Histórico de Respostas ({messageReplies.length})</span><ChevronDown className={`h-4 w-4 transition-transform ${repliesOpen ? 'rotate-180' : ''}`} /></Button></CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 mt-2">{loadingReplies ? <Skeleton className="h-20 w-full" /> : messageReplies.map((reply) => (
                        <div key={reply.id} className="p-3 bg-muted/30 rounded-lg border"><div className="flex items-center gap-2 mb-2">{reply.is_ai_generated ? <AIIcon size="sm" /> : <User className="h-4 w-4 text-primary" />}<span className="text-xs text-muted-foreground">{formatDate(reply.replied_at)}</span>{reply.sent_via_email && <Badge variant="outline" className="text-xs"><Mail className="h-3 w-3 mr-1" />Enviado</Badge>}{reply.is_ai_generated && <Badge variant="outline" className="text-xs bg-primary/10 text-primary"><AIIcon size="xs" className="mr-1" />IA</Badge>}</div><p className="text-sm whitespace-pre-wrap">{reply.reply_text}</p></div>
                      ))}</CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!messageToDelete} onOpenChange={() => setMessageToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir mensagem?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. A mensagem de "{messageToDelete?.name}" será permanentemente removida.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={deleteMessage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      </div>
    </DashboardLayout>
  );
}

export default function ContactMessagesManager() {
  return (
    <PermissionGate permission="can_manage_messages">
      <ContactMessagesManagerContent />
    </PermissionGate>
  );
}
