import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ShieldX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface AdminRouteProps {
  children: ReactNode;
}

function AccessDenied() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
          <ShieldX className="w-10 h-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{t('admin.accessDenied')}</h1>
          <p className="text-muted-foreground">{t('admin.noPermission')}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/'}>{t('admin.backToSite')}</Button>
          <Button variant="ghost" onClick={signOut}>{t('admin.logout')}</Button>
        </div>
      </div>
    </div>
  );
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    async function checkAdminRole() {
      if (!user) { setCheckingRole(false); return; }
      try {
        const { data, error } = await (supabase as any).rpc('is_current_user_admin');
        if (error) { setIsAdmin(false); } else { setIsAdmin(data === true); }
      } catch { setIsAdmin(false); } finally { setCheckingRole(false); }
    }
    if (!authLoading) checkAdminRole();
  }, [user, authLoading]);

  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t('admin.checkingPermissions')}</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;
  if (isAdmin === false) return <AccessDenied />;
  return <>{children}</>;
}
