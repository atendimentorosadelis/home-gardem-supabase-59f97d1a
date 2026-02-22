import React from 'react';
import { useAdminPermissions, DEFAULT_PERMISSIONS } from '@/hooks/use-admin-permissions';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface PermissionGateProps {
  permission: keyof typeof DEFAULT_PERMISSIONS;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ permission, children, fallback }: PermissionGateProps) {
  const { hasPermission, isLoading, isSuperAdmin } = useAdminPermissions();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const hasAccess = isSuperAdmin || hasPermission(permission);

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground max-w-md">
            Você não tem permissão para acessar esta funcionalidade.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return <>{children}</>;
}

export function usePermissionCheck(permission: keyof typeof DEFAULT_PERMISSIONS) {
  const { hasPermission, isLoading, isSuperAdmin } = useAdminPermissions();
  return { hasAccess: isSuperAdmin || hasPermission(permission), isLoading, isSuperAdmin };
}
