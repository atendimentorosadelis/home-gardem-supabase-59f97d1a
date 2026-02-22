import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAdminPermissions, PERMISSION_LABELS, DEFAULT_PERMISSIONS } from '@/hooks/use-admin-permissions';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown, ShieldAlert, Loader2 } from 'lucide-react';

export default function SuperAdminPanel() {
  const { user } = useAuth();
  const { isSuperAdmin, isLoading } = useAdminPermissions();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground">Apenas Super Administradores podem acessar esta página.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Crown className="h-7 w-7 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Painel Super Admin</h1>
            <p className="text-muted-foreground">Gerencie permissões e configurações avançadas</p>
          </div>
        </div>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Permissões</CardTitle>
            <CardDescription>Esta página requer sincronização completa do repositório para funcionar com todas as funcionalidades.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-yellow-500/20 text-yellow-700">
                <Crown className="h-3 w-3 mr-1" /> Super Admin
              </Badge>
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
