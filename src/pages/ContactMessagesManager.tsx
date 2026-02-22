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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MessageSquare, Search, RefreshCw, Trash2, Eye, Mail, Clock, CheckCircle, MessageCircle, Inbox, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean | null;
  replied_at: string | null;
  created_at: string;
}

function getStatus(msg: ContactMessage): string {
  if (msg.replied_at) return 'replied';
  if (msg.is_read) return 'read';
  return 'pending';
}

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock },
  read: { label: 'Lido', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Eye },
  replied: { label: 'Respondido', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle },
};

const subjectLabels: Record<string, string> = {
  question: 'Dúvida sobre conteúdo',
  suggestion: 'Sugestão de artigo',
  partnership: 'Parceria/Colaboração',
  problem: 'Reportar problema',
  other: 'Outro',
};

function ContactMessagesManagerContent() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<ContactMessage | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível carregar as mensagens.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel('contact-messages-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, () => {
        fetchMessages();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const stats = useMemo(() => {
    const total = messages.length;
    const pending = messages.filter(m => getStatus(m) === 'pending').length;
    const read = messages.filter(m => getStatus(m) === 'read').length;
    const replied = messages.filter(m => getStatus(m) === 'replied').length;
    return { total, pending, read, replied };
  }, [messages]);

  const markAsRead = async (id: string) => {
    await (supabase as any).from('contact_messages').update({ is_read: true }).eq('id', id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
  };

  const deleteMessage = async () => {
    if (!messageToDelete) return;
    try {
      const { error } = await (supabase as any).from('contact_messages').delete().eq('id', messageToDelete.id);
      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== messageToDelete.id));
      toast({ title: 'Mensagem excluída', description: 'A mensagem foi removida com sucesso.' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir a mensagem.', variant: 'destructive' });
    } finally {
      setMessageToDelete(null);
    }
  };

  const handleViewMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    setReplyText('');
    if (!message.is_read) await markAsRead(message.id);
  };

  const handleMarkReplied = async () => {
    if (!selectedMessage) return;
    setIsSendingReply(true);
    try {
      const { error } = await (supabase as any)
        .from('contact_messages')
        .update({ replied_at: new Date().toISOString() })
        .eq('id', selectedMessage.id);
      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === selectedMessage.id ? { ...m, replied_at: new Date().toISOString() } : m));
      setSelectedMessage(prev => prev ? { ...prev, replied_at: new Date().toISOString() } : null);
      toast({ title: 'Marcado como respondido' });
    } catch (error) {
      toast({ title: 'Erro', variant: 'destructive' });
    } finally {
      setIsSendingReply(false);
    }
  };

  const filteredMessages = useMemo(() => messages.filter(message => {
    const matchesSearch = message.name.toLowerCase().includes(searchQuery.toLowerCase()) || message.email.toLowerCase().includes(searchQuery.toLowerCase()) || (message.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
    const status = getStatus(message);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [messages, searchQuery, statusFilter]);

  const paginatedMessages = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMessages.slice(start, start + itemsPerPage);
  }, [filteredMessages, currentPage]);
  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);
  const formatDateStr = (dateStr: string) => format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />Mensagens de Contato
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie as mensagens recebidas pelo formulário de contato.</p>
          </div>
          <Button onClick={fetchMessages} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Inbox className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-10" /> : stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-yellow-500/10"><Clock className="h-5 w-5 text-yellow-500" /></div><div><p className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-10" /> : stats.pending}</p><p className="text-xs text-muted-foreground">Pendentes</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><Eye className="h-5 w-5 text-blue-500" /></div><div><p className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-10" /> : stats.read}</p><p className="text-xs text-muted-foreground">Lidas</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/10"><CheckCircle className="h-5 w-5 text-green-500" /></div><div><p className="text-2xl font-bold">{loading ? <Skeleton className="h-7 w-10" /> : stats.replied}</p><p className="text-xs text-muted-foreground">Respondidas</p></div></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome, e-mail ou assunto..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="read">Lido</SelectItem>
                  <SelectItem value="replied">Respondido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mensagens</CardTitle>
            <CardDescription>{filteredMessages.length} mensagem(ns) encontrada(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : paginatedMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhuma mensagem encontrada.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Remetente</TableHead>
                        <TableHead>Assunto</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMessages.map((message) => {
                        const status = getStatus(message);
                        const cfg = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
                        const StatusIcon = cfg.icon;
                        const isPending = status === 'pending';
                        return (
                          <TableRow key={message.id} className={cn(isPending && 'bg-yellow-500/5 hover:bg-yellow-500/10', 'cursor-pointer')} onClick={() => handleViewMessage(message)}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {isPending && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span></span>}
                                <div><p className={cn("font-medium", isPending && "font-semibold")}>{message.name}</p><p className="text-sm text-muted-foreground">{message.email}</p></div>
                              </div>
                            </TableCell>
                            <TableCell><p className={cn("max-w-[200px] truncate", isPending && "font-medium")}>{subjectLabels[message.subject || ''] || message.subject || 'Sem assunto'}</p></TableCell>
                            <TableCell><Badge variant="outline" className={cfg.color}><StatusIcon className={cn("h-3 w-3 mr-1", isPending && "animate-pulse")} />{cfg.label}</Badge></TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDateStr(message.created_at)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewMessage(message); }}><Eye className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setMessageToDelete(message); }} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
                      <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Próxima</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedMessage && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" />Mensagem de {selectedMessage.name}</DialogTitle>
                  <DialogDescription>Recebida em {formatDateStr(selectedMessage.created_at)}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-sm font-medium text-muted-foreground">E-mail</p><p className="text-foreground">{selectedMessage.email}</p></div>
                    <div><p className="text-sm font-medium text-muted-foreground">Assunto</p><p className="text-foreground">{subjectLabels[selectedMessage.subject || ''] || selectedMessage.subject || 'Sem assunto'}</p></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Mensagem</p>
                    <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap">{selectedMessage.message}</div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Sua Resposta</p>
                    <Textarea placeholder="Digite sua resposta aqui..." value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={4} className="resize-none" />
                    <div className="flex items-center justify-end gap-2">
                      {!selectedMessage.replied_at && (
                        <Button variant="outline" onClick={handleMarkReplied} disabled={isSendingReply}>
                          {isSendingReply ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                          Marcar como Respondido
                        </Button>
                      )}
                      <Button onClick={() => { window.open(`mailto:${selectedMessage.email}?subject=Re: ${subjectLabels[selectedMessage.subject || ''] || selectedMessage.subject || ''}&body=${encodeURIComponent(replyText)}`, '_blank'); }}>
                        <Mail className="h-4 w-4 mr-2" />Responder por E-mail
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!messageToDelete} onOpenChange={() => setMessageToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir mensagem?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita. A mensagem de "{messageToDelete?.name}" será permanentemente removida.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={deleteMessage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
