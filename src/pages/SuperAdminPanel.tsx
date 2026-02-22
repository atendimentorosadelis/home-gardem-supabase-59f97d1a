import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  useAdminPermissions,
  PERMISSION_LABELS,
  DEFAULT_PERMISSIONS,
  type AdminWithPermissions
} from '@/hooks/use-admin-permissions';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AuditLogTable } from '@/components/dashboard/AuditLogTable';
import {
  Shield,
  ShieldAlert,
  Crown,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  User,
  Loader2,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  History,
  Video,
  Power,
} from 'lucide-react';
import { useArticleVideos } from '@/hooks/use-article-videos';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function SuperAdminPanel() {
  const { user } = useAuth();
  const {
    admins,
    isLoading,
    isSuperAdmin,
    updatePermission,
    setAllPermissions,
    toggleSuperAdmin,
    refetch
  } = useAdminPermissions();

  // Video Auto Generation settings
  const {
    settings: videoSettings,
    isLoading: isLoadingVideoSettings,
    toggleGlobalEnabled: toggleVideoGeneration
  } = useArticleVideos();
  const [isTogglingVideo, setIsTogglingVideo] = useState(false);

  const [updatingPermission, setUpdatingPermission] = useState<string | null>(null);
  const [togglingAll, setTogglingAll] = useState<string | null>(null);
  const [promotingAdmin, setPromotingAdmin] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    admin: AdminWithPermissions | null;
    action: 'promote' | 'revoke';
  }>({ open: false, admin: null, action: 'promote' });

  // Pagination settings
  const adminsPerPage = 5;
  const indexOfLastAdmin = currentPage * adminsPerPage;
  const indexOfFirstAdmin = indexOfLastAdmin - adminsPerPage;
  const currentAdmins = admins.slice(indexOfFirstAdmin, indexOfLastAdmin);
  const totalPages = Math.ceil(admins.length / adminsPerPage);

  // Check if current user is the Master Super Admin (Walliston)
  const currentUserAdmin = admins.find(a => a.user_id === user?.id);
  const isMasterSuperAdmin = currentUserAdmin?.username?.toLowerCase().includes('walliston') || false;

  // Group permissions by category
  const permissionsByCategory = Object.entries(PERMISSION_LABELS).reduce((acc, [key, value]) => {
    if (!acc[value.category]) {
      acc[value.category] = [];
    }
    acc[value.category].push({ key: key as keyof typeof PERMISSION_LABELS, ...value });
    return acc;
  }, {} as Record<string, Array<{ key: keyof typeof PERMISSION_LABELS; label: string; description: string; category: string }>>);

  const handleTogglePermission = async (admin: AdminWithPermissions, permissionKey: keyof typeof PERMISSION_LABELS) => {
    if (admin.isSuperAdmin) {
      toast.error('Não é possível alterar permissões do Super Admin');
      return;
    }

    const updateKey = `${admin.user_id}-${permissionKey}`;
    setUpdatingPermission(updateKey);

    const currentValue = admin.permissions?.[permissionKey] ?? DEFAULT_PERMISSIONS[permissionKey];
    await updatePermission(admin.user_id, permissionKey, !currentValue);

    setUpdatingPermission(null);
  };

  const handleToggleAll = async (admin: AdminWithPermissions, enabled: boolean) => {
    if (admin.isSuperAdmin) {
      toast.error('Não é possível alterar permissões do Super Admin');
      return;
    }

    setTogglingAll(admin.user_id);
    await setAllPermissions(admin.user_id, enabled);
    setTogglingAll(null);
  };

  const openPromoteDialog = (admin: AdminWithPermissions) => {
    setConfirmDialog({ open: true, admin, action: 'promote' });
  };

  const openRevokeDialog = (admin: AdminWithPermissions) => {
    setConfirmDialog({ open: true, admin, action: 'revoke' });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.admin) return;

    const admin = confirmDialog.admin;
    const isPromoting = confirmDialog.action === 'promote';

    setConfirmDialog({ open: false, admin: null, action: 'promote' });
    setPromotingAdmin(admin.user_id);
    await toggleSuperAdmin(admin.user_id, isPromoting);
    setPromotingAdmin(null);
  };

  const handleToggleVideoGeneration = async () => {
    setIsTogglingVideo(true);
    await toggleVideoGeneration(!videoSettings.enabled);
    setIsTogglingVideo(false);
  };

  const isCurrentUser = (admin: AdminWithPermissions) => {
    return user?.id === admin.user_id;
  };

  const getInitials = (admin: AdminWithPermissions) => {
    if (admin.username) {
      return admin.username.slice(0, 2).toUpperCase();
    }
    if (admin.email) {
      return admin.email.slice(0, 2).toUpperCase();
    }
    return 'AD';
  };

  const getPermissionValue = (admin: AdminWithPermissions, key: keyof typeof PERMISSION_LABELS): boolean => {
    if (admin.isSuperAdmin) return true;
    return admin.permissions?.[key] ?? DEFAULT_PERMISSIONS[key];
  };

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground max-w-md">
            Esta área é exclusiva para o Super Administrador do sistema.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-destructive" />
              <h1 className="text-2xl font-bold">Painel Super Admin</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Gerencie permissões de acesso para todos os administradores
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="permissions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="permissions">
              <Shield className="h-4 w-4 mr-2" />
              Permissões
            </TabsTrigger>
            <TabsTrigger value="audit">
              <History className="h-4 w-4 mr-2" />
              Histórico de Alterações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="permissions" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Admins</p>
                      <p className="text-2xl font-bold">{admins.length}</p>
                    </div>
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Super Admins</p>
                      <p className="text-2xl font-bold">{admins.filter(a => a.isSuperAdmin).length}</p>
                    </div>
                    <Crown className="h-8 w-8 text-chart-4" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Permissões Disponíveis</p>
                      <p className="text-2xl font-bold">{Object.keys(PERMISSION_LABELS).length}</p>
                    </div>
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Video Auto Generation Control */}
            <Card className={cn(
              "transition-all border-2 relative overflow-hidden",
              videoSettings.enabled
                ? "border-green-500/50 bg-gradient-to-r from-green-500/10 to-emerald-500/5"
                : "border-border"
            )}>
              {videoSettings.enabled && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent pointer-events-none" />
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg">Automação de Vídeos do YouTube</CardTitle>
                </div>
                <CardDescription>
                  Controle global da geração automática de vídeos para artigos publicados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className={cn(
                      "text-xl font-bold",
                      videoSettings.enabled ? "text-green-500" : "text-muted-foreground"
                    )}>
                      {videoSettings.enabled ? 'Sistema Ativado' : 'Sistema Desativado'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {videoSettings.enabled
                        ? `Limite diário: ${videoSettings.daily_limit} vídeos`
                        : 'Nenhum vídeo será processado automaticamente'}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleVideoGeneration}
                    disabled={isTogglingVideo || isLoadingVideoSettings}
                    className={cn(
                      "relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
                      videoSettings.enabled
                        ? "bg-green-500 text-white shadow-lg shadow-green-500/30 hover:bg-green-600"
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                      (isTogglingVideo || isLoadingVideoSettings) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isTogglingVideo ? (
                      <Loader2 className="h-7 w-7 animate-spin" />
                    ) : (
                      <>
                        <Power className="h-7 w-7" />
                        {videoSettings.enabled && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse" />
                        )}
                      </>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Admin List */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-10 w-48" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-32 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {currentAdmins.map(admin => (
                  <Card key={admin.user_id} className={cn(
                    "transition-all",
                    admin.isSuperAdmin && "border-chart-4/50 bg-chart-4/5"
                  )}>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={admin.avatar_url || undefined} />
                            <AvatarFallback>{getInitials(admin)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">
                                {admin.username || 'Sem nome'}
                              </CardTitle>
                              {admin.isSuperAdmin && (
                                <Badge variant="outline" className="border-chart-4 text-chart-4">
                                  <Crown className="h-3 w-3 mr-1" />
                                  {admin.username?.toLowerCase().includes('walliston') ? 'Super Admin Master' : 'Super Admin'}
                                </Badge>
                              )}
                              {isCurrentUser(admin) && (
                                <Badge variant="secondary">
                                  Você
                                </Badge>
                              )}
                            </div>
                            <CardDescription>{admin.email}</CardDescription>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {!admin.isSuperAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-chart-4 text-chart-4 hover:bg-chart-4/10"
                              onClick={() => openPromoteDialog(admin)}
                              disabled={promotingAdmin === admin.user_id}
                            >
                              {promotingAdmin === admin.user_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <ShieldCheck className="h-4 w-4 mr-2" />
                                  Promover a Super Admin
                                </>
                              )}
                            </Button>
                          )}

                          {admin.isSuperAdmin && !isCurrentUser(admin) && isMasterSuperAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-destructive text-destructive hover:bg-destructive/10"
                              onClick={() => openRevokeDialog(admin)}
                              disabled={promotingAdmin === admin.user_id}
                            >
                              {promotingAdmin === admin.user_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <ShieldX className="h-4 w-4 mr-2" />
                                  Revogar Super Admin
                                </>
                              )}
                            </Button>
                          )}

                          {!admin.isSuperAdmin && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleAll(admin, false)}
                                disabled={togglingAll === admin.user_id}
                              >
                                {togglingAll === admin.user_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <ToggleLeft className="h-4 w-4 mr-2" />
                                    Desativar Tudo
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleAll(admin, true)}
                                disabled={togglingAll === admin.user_id}
                              >
                                {togglingAll === admin.user_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <ToggleRight className="h-4 w-4 mr-2" />
                                    Ativar Tudo
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {admin.isSuperAdmin ? (
                        <div className="bg-chart-4/10 rounded-lg p-4 text-center">
                          <Crown className="h-8 w-8 mx-auto text-chart-4 mb-2" />
                          <p className="text-sm font-medium">Super Administrador</p>
                          <p className="text-xs text-muted-foreground">
                            Possui acesso irrestrito a todas as funcionalidades
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                            <div key={category}>
                              <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                                {category}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {permissions.map(permission => {
                                  const isEnabled = getPermissionValue(admin, permission.key);
                                  const isUpdating = updatingPermission === `${admin.user_id}-${permission.key}`;

                                  return (
                                    <div
                                      key={permission.key}
                                      className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border transition-colors",
                                        isEnabled ? "bg-primary/5 border-primary/20" : "bg-muted/50"
                                      )}
                                    >
                                      <div className="flex-1 min-w-0 mr-3">
                                        <p className="text-sm font-medium truncate">
                                          {permission.label}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {permission.description}
                                        </p>
                                      </div>
                                      <Switch
                                        checked={isEnabled}
                                        onCheckedChange={() => handleTogglePermission(admin, permission.key)}
                                        disabled={isUpdating}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                              {category !== Object.keys(permissionsByCategory).slice(-1)[0] && (
                                <Separator className="mt-4" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className={cn(
                            "cursor-pointer",
                            currentPage === 1 && "pointer-events-none opacity-50"
                          )}
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className={cn(
                            "cursor-pointer",
                            currentPage === totalPages && "pointer-events-none opacity-50"
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            )}

            {!isLoading && admins.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <User className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Nenhum administrador encontrado</p>
                  <p className="text-sm text-muted-foreground">
                    Adicione administradores na página de Usuários
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico de Alterações de Permissões
                </CardTitle>
                <CardDescription>
                  Registro de todas as alterações de permissões e status de Super Admin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuditLogTable
                  limit={50}
                  showFilters={true}
                  isSuperAdmin={true}
                  actionTypes={[
                    'permission_changed',
                    'all_permissions_changed',
                    'super_admin_promoted',
                    'super_admin_revoked',
                    'role_promoted',
                    'role_revoked',
                    'audit_log_cleared'
                  ]}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Confirmation Dialog */}
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, admin: null, action: 'promote' })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                  "p-2 rounded-full",
                  confirmDialog.action === 'promote' ? "bg-chart-4/20" : "bg-destructive/20"
                )}>
                  {confirmDialog.action === 'promote' ? (
                    <Crown className="h-6 w-6 text-chart-4" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  )}
                </div>
                <AlertDialogTitle className="text-xl">
                  {confirmDialog.action === 'promote'
                    ? 'Promover a Super Admin'
                    : 'Revogar Super Admin'}
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  {confirmDialog.action === 'promote' ? (
                    <>
                      <p>
                        Você está prestes a promover <strong>{confirmDialog.admin?.username || confirmDialog.admin?.email}</strong> a Super Admin.
                      </p>
                      <div className="bg-chart-4/10 border border-chart-4/30 rounded-lg p-3 space-y-2">
                        <p className="font-medium text-chart-4 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Poderes concedidos:
                        </p>
                        <ul className="text-sm space-y-1 ml-6 list-disc text-foreground/80">
                          <li>Acesso irrestrito a todas as funcionalidades</li>
                          <li>Gerenciar permissões de outros administradores</li>
                          <li>Promover e revogar outros Super Admins</li>
                          <li>Excluir qualquer conta de administrador</li>
                        </ul>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Esta ação pode ser revertida posteriormente.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        Você está prestes a revogar o status de Super Admin de <strong>{confirmDialog.admin?.username || confirmDialog.admin?.email}</strong>.
                      </p>
                      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-2">
                        <p className="font-medium text-destructive flex items-center gap-2">
                          <ShieldX className="h-4 w-4" />
                          Consequências:
                        </p>
                        <ul className="text-sm space-y-1 ml-6 list-disc text-foreground/80">
                          <li>Perderá acesso ao Painel Super Admin</li>
                          <li>Não poderá mais gerenciar permissões</li>
                          <li>Terá apenas as permissões individuais configuradas</li>
                        </ul>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Esta ação pode ser revertida posteriormente.
                      </p>
                    </>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmAction}
                className={cn(
                  confirmDialog.action === 'promote'
                    ? "bg-chart-4 hover:bg-chart-4/90 text-chart-4-foreground"
                    : "bg-destructive hover:bg-destructive/90"
                )}
              >
                {confirmDialog.action === 'promote' ? (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Confirmar Promoção
                  </>
                ) : (
                  <>
                    <ShieldX className="h-4 w-4 mr-2" />
                    Confirmar Revogação
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
