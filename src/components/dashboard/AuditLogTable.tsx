// Stub - AuditLogTable component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AuditLogTable() {
  return (
    <Card className="border-border/50">
      <CardHeader><CardTitle className="text-base">Log de Auditoria</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Nenhum registro de auditoria encontrado.</p>
      </CardContent>
    </Card>
  );
}
