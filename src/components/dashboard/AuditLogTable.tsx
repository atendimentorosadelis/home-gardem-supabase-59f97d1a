import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClipboardList, RefreshCw, User, Shield, FileText, Settings } from 'lucide-react';

interface AuditLogTableProps {
  limit?: number;
  showFilters?: boolean;
  isSuperAdmin?: boolean;
  actionTypes?: string[];
}

interface AuditLog {
  id: string;
  user_id: string | null;
  action_type: string;
  target_user_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  role_promoted: 'Promovido a Admin',
  role_revoked: 'Admin Revogado',
  user_edited: 'Usuário Editado',
  password_reset_sent: 'Reset de Senha Enviado',
  article_published: 'Artigo Publicado',
  article_unpublished: 'Artigo Despublicado',
  article_deleted: 'Artigo Excluído',
  user_login: 'Login',
  user_logout: 'Logout',
  permission_changed: 'Permissão Alterada',
  all_permissions_changed: 'Todas Permissões Alteradas',
  super_admin_promoted: 'Promovido a Super Admin',
  super_admin_revoked: 'Super Admin Revogado',
  audit_log_cleared: 'Log de Auditoria Limpo',
};

const ACTION_COLORS: Record<string, string> = {
  role_promoted: 'default',
  role_revoked: 'destructive',
  user_edited: 'secondary',
  password_reset_sent: 'outline',
  article_published: 'default',
  article_unpublished: 'secondary',
  article_deleted: 'destructive',
  user_login: 'outline',
  user_logout: 'outline',
  permission_changed: 'secondary',
  all_permissions_changed: 'secondary',
  super_admin_promoted: 'default',
  super_admin_revoked: 'destructive',
};

function getActionIcon(action: string) {
  if (action.includes('role') || action.includes('super_admin')) return <Shield className="h-4 w-4" />;
  if (action.includes('article')) return <FileText className="h-4 w-4" />;
  if (action.includes('permission')) return <Settings className="h-4 w-4" />;
  return <User className="h-4 w-4" />;
}

export function AuditLogTable({ limit = 50, showFilters = false, isSuperAdmin = false, actionTypes }: AuditLogTableProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let query = (supabase as any)
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (actionTypes && actionTypes.length > 0) {
        query = query.in('action_type', actionTypes);
      }

      if (filterType && filterType !== 'all') {
        query = query.eq('action_type', filterType);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching audit logs:', error);
        return;
      }
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [limit, filterType, actionTypes?.join(',')]);

  const availableTypes = actionTypes || Object.keys(ACTION_LABELS);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex items-center gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {availableTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {ACTION_LABELS[type] || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
        </div>
      )}

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">Nenhum registro de auditoria encontrado.</p>
          <p className="text-xs mt-1">As ações administrativas aparecerão aqui automaticamente.</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="mt-0.5 text-muted-foreground">
                  {getActionIcon(log.action_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={ACTION_COLORS[log.action_type] as any || 'outline'}>
                      {ACTION_LABELS[log.action_type] || log.action_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-foreground/80">
                    {log.details?.actor_username && (
                      <span className="font-medium">{log.details.actor_username}</span>
                    )}
                    {log.details?.actor_email && !log.details?.actor_username && (
                      <span className="font-medium">{log.details.actor_email}</span>
                    )}
                    {log.details?.target_username && (
                      <span> → <span className="font-medium">{log.details.target_username}</span></span>
                    )}
                    {log.details?.target_email && !log.details?.target_username && (
                      <span> → <span className="font-medium">{log.details.target_email}</span></span>
                    )}
                  </div>
                  {log.details && (
                    <div className="mt-1 text-xs text-muted-foreground space-x-2">
                      {log.details.article_title && <span>Artigo: {log.details.article_title}</span>}
                      {log.details.permission_name && <span>Permissão: {log.details.permission_name}</span>}
                      {log.details.new_value !== undefined && <span>Novo valor: {String(log.details.new_value)}</span>}
                      {log.details.reason && <span>Motivo: {log.details.reason}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
