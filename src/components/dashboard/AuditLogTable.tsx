import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AuditLogTableProps {
  limit?: number;
  showFilters?: boolean;
  isSuperAdmin?: boolean;
  actionTypes?: string[];
}

export function AuditLogTable({ limit, showFilters, isSuperAdmin, actionTypes }: AuditLogTableProps) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">Nenhum registro de auditoria encontrado.</p>
    </div>
  );
}
