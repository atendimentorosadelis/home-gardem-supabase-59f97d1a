import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PermissionGate } from '@/components/PermissionGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageIcon } from 'lucide-react';

function ImagesDashboardContent() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ImageIcon className="h-7 w-7" /> Imagens
          </h1>
          <p className="text-muted-foreground">Gerencie as imagens do site</p>
        </div>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Dashboard de Imagens</CardTitle>
            <CardDescription>Esta página requer sincronização completa do repositório.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Use git push --force para copiar todos os arquivos de uma vez.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function ImagesDashboard() {
  return (
    <PermissionGate permission="can_manage_image_library">
      <ImagesDashboardContent />
    </PermissionGate>
  );
}
