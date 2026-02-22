import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PermissionGate } from '@/components/PermissionGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, Loader2 } from 'lucide-react';

function SettingsContent() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-7 w-7" /> Configurações
          </h1>
          <p className="text-muted-foreground">Gerencie as configurações do site</p>
        </div>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Configurações do Site</CardTitle>
            <CardDescription>
              Esta página requer sincronização completa do repositório para funcionar com todas as abas (Geral, Social, Notificações, IA).
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

export default function Settings() {
  return (
    <PermissionGate permission="can_manage_settings">
      <SettingsContent />
    </PermissionGate>
  );
}
