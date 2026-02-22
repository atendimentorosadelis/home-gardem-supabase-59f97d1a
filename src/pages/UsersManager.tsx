import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PermissionGate } from '@/components/PermissionGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

function UsersManagerContent() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7" /> Usuários
          </h1>
          <p className="text-muted-foreground">Gerencie os administradores do sistema</p>
        </div>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Gerenciamento de Usuários</CardTitle>
            <CardDescription>
              Esta página requer sincronização completa do repositório para funcionar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Use git push --force para copiar todos os arquivos de uma vez.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function UsersManager() {
  return (
    <PermissionGate permission="can_manage_users">
      <UsersManagerContent />
    </PermissionGate>
  );
}
