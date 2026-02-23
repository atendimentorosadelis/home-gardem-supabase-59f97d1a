import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PermissionGate } from '@/components/PermissionGate';
import { supabase } from '@/lib/supabase';
import { invokeEdgeFunction } from '@/lib/edge-functions';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/use-audit-log';
import { useOnlinePresence } from '@/contexts/OnlinePresenceContext';
import { AuditLogTable } from '@/components/dashboard/AuditLogTable';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Search,
  RefreshCw,
  Pencil,
  ShieldCheck,
  ShieldOff,
  KeyRound,
  Loader2,
  History,
  UserPlus,
  Crown,
  Trash2,
  Eye,
  EyeOff,
  Circle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string | null;
  role: 'admin' | 'user';
  isSuperAdmin?: boolean;
}

// Super Admin identifier - only this user can revoke other admins
const SUPER_ADMIN_EMAIL = 'walliston';  // Will match username containing 'walliston'

function UsersManagerContent() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { logAction } = useAuditLog();
  const { isUserOnline, onlineCount } = useOnlinePresence();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [saving, setSaving] = useState(false);

  // Role toggle confirmation
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleAction, setRoleAction] = useState<{ user: UserWithRole; action: 'promote' | 'revoke' } | null>(null);
  const [togglingRole, setTogglingRole] = useState(false);

  // Password reset
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);

  // Add admin modal state
  const [addAdminModalOpen, setAddAdminModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false);
  const [addingAdmin, setAddingAdmin] = useState(false);

  // Edit password state
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete user state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Check if current user is Super Admin
  const isSuperAdmin = (user: UserWithRole) => {
    return user.username?.toLowerCase().includes('walliston') || false;
  };

  const currentUserIsSuperAdmin = users.find(u => u.user_id === currentUser?.id)?.isSuperAdmin || false;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, email, username, avatar_url, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles (ordered by role to prioritize 'admin' over 'user')
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .order('role', { ascending: true }); // 'admin' comes before 'user' alphabetically

      if (rolesError) throw rolesError;

      // Merge profiles with roles - prioritize 'admin' role if user has multiple roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        // Find all roles for this user
        const userRoles = roles?.filter(r => r.user_id === profile.user_id) || [];
        // Prioritize 'admin' role if present
        const hasAdmin = userRoles.some(r => r.role === 'admin');
        const isSuper = profile.username?.toLowerCase().includes('walliston') || false;
        return {
          ...profile,
          role: hasAdmin ? 'admin' : 'user',
          isSuperAdmin: isSuper,
        };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (user.username?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Check if current user can edit the target user's name
  const canEditUserName = (targetUser: UserWithRole) => {
    return currentUserIsSuperAdmin;
  };

  // Check if current user can change the target user's password
  const canChangePassword = (targetUser: UserWithRole) => {
    if (currentUserIsSuperAdmin) return true;
    if (targetUser.user_id === currentUser?.id) return true;
    return false;
  };

  const handleEditUser = (user: UserWithRole) => {
    setEditingUser(user);
    setEditUsername(user.username || '');
    setEditPassword('');
    setShowEditPassword(false);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    setSaving(true);
    try {
      const oldUsername = editingUser.username;
      const newUsername = editUsername.trim() || null;

      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', editingUser.id);

      if (error) throw error;

      // Log the action
      await logAction({
        action_type: 'user_edited',
        target_user_id: editingUser.user_id,
        details: {
          old_username: oldUsername,
          new_username: newUsername,
        },
      });

      setUsers(prev => prev.map(u =>
        u.id === editingUser.id
          ? { ...u, username: newUsername }
          : u
      ));

      toast.success('Usuário atualizado com sucesso');
      setEditModalOpen(false);
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error('Erro ao atualizar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleToggle = (user: UserWithRole) => {
    // Prevent self-demotion
    if (user.user_id === currentUser?.id) {
      toast.error('Você não pode alterar seu próprio papel');
      return;
    }

    // Only Super Admin can revoke other admins
    if (user.role === 'admin' && !currentUserIsSuperAdmin) {
      toast.error('Somente o Super Admin pode revogar permissões de administrador');
      return;
    }

    // Cannot revoke Super Admin
    if (user.isSuperAdmin) {
      toast.error('Não é possível revogar o Super Admin');
      return;
    }

    setRoleAction({
      user,
      action: user.role === 'admin' ? 'revoke' : 'promote',
    });
    setRoleDialogOpen(true);
  };

  const confirmRoleToggle = async () => {
    if (!roleAction) return;

    setTogglingRole(true);
    try {
      const { user, action } = roleAction;

      if (action === 'promote') {
        // First, remove any existing 'user' role to avoid duplicates
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.user_id)
          .eq('role', 'user');

        // Check if already has admin role
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', user.user_id)
          .eq('role', 'admin')
          .single();

        if (!existingRole) {
          const { error } = await supabase
            .from('user_roles')
            .insert({ user_id: user.user_id, role: 'admin' });

          if (error) throw error;
        }
      } else {
        // Remove admin role
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', user.user_id)
          .eq('role', 'admin');

        if (deleteError) throw deleteError;

        // Check if user has a 'user' role, if not insert one
        const { data: existingUserRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', user.user_id)
          .eq('role', 'user')
          .single();

        if (!existingUserRole) {
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({ user_id: user.user_id, role: 'user' });

          if (insertError) throw insertError;
        }
      }

      // Log the action
      await logAction({
        action_type: action === 'promote' ? 'role_promoted' : 'role_revoked',
        target_user_id: user.user_id,
        details: {
          target_email: user.email,
          target_username: user.username,
        },
      });

      // Update local state
      setUsers(prev => prev.map(u =>
        u.user_id === user.user_id
          ? { ...u, role: action === 'promote' ? 'admin' : 'user' }
          : u
      ));

      toast.success(
        action === 'promote'
          ? 'Usuário promovido a administrador'
          : 'Permissão de administrador revogada'
      );
    } catch (error: any) {
      console.error('Error toggling role:', error);
      toast.error('Erro ao alterar permissão');
    } finally {
      setTogglingRole(false);
      setRoleDialogOpen(false);
      setRoleAction(null);
    }
  };

  const handleResetPassword = async (user: UserWithRole) => {
    if (!user.email) {
      toast.error('Usuário não possui email cadastrado');
      return;
    }

    // Only Super Admin can reset other users' passwords
    if (!currentUserIsSuperAdmin) {
      toast.error('Somente o Super Admin pode resetar senha de outros usuários');
      return;
    }

    setResettingPassword(user.id);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/admin/profile`,
      });

      if (error) throw error;

      // Log the action
      await logAction({
        action_type: 'password_reset_sent',
        target_user_id: user.user_id,
        details: {
          target_email: user.email,
        },
      });

      toast.success(`Email de recuperação enviado para ${user.email}`);
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      toast.error('Erro ao enviar email de recuperação');
    } finally {
      setResettingPassword(null);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    // Validate password if provided
    if (newAdminPassword && newAdminPassword.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    setAddingAdmin(true);
    try {
      const { data, error } = await invokeEdgeFunction('invite-admin', {
        email: newAdminEmail.trim(),
        username: newAdminName.trim() || null,
        password: newAdminPassword.trim() || null,
      }, true); // requiresAuth = true

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Log the action
      await logAction({
        action_type: 'role_promoted',
        target_user_id: data.userId,
        details: {
          email: newAdminEmail.trim(),
          username: newAdminName.trim(),
          method: newAdminPassword ? 'direct_creation' : 'invite',
        },
      });

      toast.success(data.message || 'Admin adicionado com sucesso!');
      setAddAdminModalOpen(false);
      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminPassword('');
      setShowNewAdminPassword(false);

      // Refresh users list
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding admin:', error);
      toast.error(error.message || 'Erro ao adicionar administrador');
    } finally {
      setAddingAdmin(false);
    }
  };

  // Handle password update
  const handleUpdatePassword = async () => {
    if (!editingUser || !editPassword.trim()) return;

    if (editPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSavingPassword(true);
    try {
      const { data, error } = await invokeEdgeFunction('admin-user-management', {
        action: 'update_password',
        targetUserId: editingUser.user_id,
        newPassword: editPassword,
      }, true); // requiresAuth = true

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Log the action
      await logAction({
        action_type: 'user_edited',
        target_user_id: editingUser.user_id,
        details: {
          action: 'password_changed',
          target_email: editingUser.email,
        },
      });

      toast.success('Senha atualizada com sucesso');
      setEditPassword('');
      setShowEditPassword(false);
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Erro ao atualizar senha');
    } finally {
      setSavingPassword(false);
    }
  };

  // Handle delete user
  const handleDeleteClick = (user: UserWithRole) => {
    if (user.isSuperAdmin) {
      toast.error('Não é possível excluir o Super Admin');
      return;
    }
    if (isCurrentUser(user)) {
      toast.error('Você não pode excluir sua própria conta');
      return;
    }
    // Only Super Admin can delete other admins
    if (user.role === 'admin' && !currentUserIsSuperAdmin) {
      toast.error('Somente o Super Admin pode excluir outros administradores');
      return;
    }
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setDeletingUser(true);
    try {
      const { data, error } = await invokeEdgeFunction('admin-user-management', {
        action: 'delete',
        targetUserId: userToDelete.user_id,
      }, true); // requiresAuth = true

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Log the action
      await logAction({
        action_type: 'user_edited',
        target_user_id: userToDelete.user_id,
        details: {
          action: 'user_deleted',
          deleted_email: userToDelete.email,
          deleted_username: userToDelete.username,
        },
      });

      toast.success('Usuário excluído com sucesso');
      setDeleteDialogOpen(false);
      setUserToDelete(null);

      // Refresh users list
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Erro ao excluir usuário');
    } finally {
      setDeletingUser(false);
    }
  };

  const getInitials = (user: UserWithRole) => {
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const isCurrentUser = (user: UserWithRole) => user.user_id === currentUser?.id;

  // Check if current user can delete a user
  const canDeleteUser = (targetUser: UserWithRole) => {
    if (targetUser.isSuperAdmin) return false;
    if (isCurrentUser(targetUser)) return false;
    if (targetUser.role === 'admin') return currentUserIsSuperAdmin;
    return true;
  };

  // Check if current user can revoke admin role from target user
  const canRevokeAdmin = (targetUser: UserWithRole) => {
    if (targetUser.isSuperAdmin) return false; // Cannot revoke Super Admin
    if (isCurrentUser(targetUser)) return false; // Cannot revoke self
    if (targetUser.role !== 'admin') return true; // Not admin, can promote
    return currentUserIsSuperAdmin; // Only Super Admin can revoke other admins
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
              <p className="text-sm text-muted-foreground">
                {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <History className="h-4 w-4" />
              Log de Auditoria
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4 mt-4">
            {/* Filters and Add Button */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                  <SelectItem value="user">Usuários</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchUsers} variant="outline" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button onClick={() => setAddAdminModalOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Admin
              </Button>
            </div>

            {/* Users Table - Desktop */}
            <div className="hidden md:block border rounded-lg overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="hidden lg:table-cell">Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {getInitials(user)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {user.username || 'Sem nome'}
                                {isCurrentUser(user) && (
                                  <span className="text-xs text-muted-foreground ml-2">(você)</span>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground truncate lg:hidden">
                                {user.email || '-'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden lg:table-cell">
                          {user.email || '-'}
                        </TableCell>
                        <TableCell>
                          {user.isSuperAdmin ? (
                            <Badge className="bg-amber-500 hover:bg-amber-600 gap-1">
                              <Crown className="h-3 w-3" />
                              <span className="hidden sm:inline">
                                {user.username?.toLowerCase().includes('walliston') ? 'Super Admin Master' : 'Super Admin'}
                              </span>
                              <span className="sm:hidden">
                                {user.username?.toLowerCase().includes('walliston') ? 'Master' : 'Super'}
                              </span>
                            </Badge>
                          ) : (
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role === 'admin' ? 'Admin' : 'Usuário'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Circle
                              className={`h-2.5 w-2.5 ${isUserOnline(user.user_id) ? 'fill-emerald-500 text-emerald-500' : 'fill-muted-foreground/30 text-muted-foreground/30'}`}
                            />
                            <span className={`text-xs ${isUserOnline(user.user_id) ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}`}>
                              {isUserOnline(user.user_id) ? 'On' : 'Off'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden sm:table-cell">
                          {user.created_at
                            ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditUser(user)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRoleToggle(user)}
                              disabled={isCurrentUser(user) || (user.role === 'admin' && !canRevokeAdmin(user))}
                              title={
                                user.isSuperAdmin
                                  ? 'Super Admin não pode ser alterado'
                                  : user.role === 'admin'
                                    ? 'Revogar admin'
                                    : 'Promover a admin'
                              }
                            >
                              {user.isSuperAdmin ? (
                                <Crown className="h-4 w-4 text-amber-500" />
                              ) : user.role === 'admin' ? (
                                <ShieldOff className="h-4 w-4 text-destructive" />
                              ) : (
                                <ShieldCheck className="h-4 w-4 text-primary" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResetPassword(user)}
                              disabled={resettingPassword === user.id || !user.email || !currentUserIsSuperAdmin}
                              title={!currentUserIsSuperAdmin ? 'Somente o Super Admin pode resetar senhas' : 'Enviar reset de senha'}
                              className="hidden sm:inline-flex"
                            >
                              {resettingPassword === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <KeyRound className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(user)}
                              disabled={!canDeleteUser(user)}
                              title="Excluir usuário"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Users Cards - Mobile */}
            <div className="md:hidden space-y-3">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4 space-y-3 bg-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {user.username || 'Sem nome'}
                            {isCurrentUser(user) && (
                              <span className="text-xs text-muted-foreground ml-1">(você)</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {user.email || '-'}
                          </p>
                        </div>
                      </div>
                      {user.isSuperAdmin ? (
                        <Badge className="bg-amber-500 hover:bg-amber-600 gap-1 shrink-0">
                          <Crown className="h-3 w-3" />
                          Super
                        </Badge>
                      ) : (
                        <Badge
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                          className="shrink-0"
                        >
                          {user.role === 'admin' ? 'Admin' : 'Usuário'}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Cadastro: {user.created_at
                          ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })
                          : '-'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Circle
                          className={`h-2.5 w-2.5 ${isUserOnline(user.user_id) ? 'fill-emerald-500 text-emerald-500' : 'fill-muted-foreground/30 text-muted-foreground/30'}`}
                        />
                        <span className={`text-xs ${isUserOnline(user.user_id) ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}`}>
                          {isUserOnline(user.user_id) ? 'On' : 'Off'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        className="flex-1"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRoleToggle(user)}
                        disabled={isCurrentUser(user) || (user.role === 'admin' && !canRevokeAdmin(user))}
                        className="flex-1"
                      >
                        {user.isSuperAdmin ? (
                          <Crown className="h-4 w-4 mr-1 text-amber-500" />
                        ) : user.role === 'admin' ? (
                          <ShieldOff className="h-4 w-4 mr-1 text-destructive" />
                        ) : (
                          <ShieldCheck className="h-4 w-4 mr-1" />
                        )}
                        {user.isSuperAdmin ? 'Super' : user.role === 'admin' ? 'Revogar' : 'Promover'}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleResetPassword(user)}
                        disabled={resettingPassword === user.id || !user.email || !currentUserIsSuperAdmin}
                        title={!currentUserIsSuperAdmin ? 'Somente o Super Admin pode resetar senhas' : 'Enviar email de recuperação'}
                      >
                        {resettingPassword === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <KeyRound className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteClick(user)}
                        disabled={!canDeleteUser(user)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <AuditLogTable limit={100} showFilters={true} isSuperAdmin={currentUserIsSuperAdmin} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere as informações do usuário abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editingUser?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Nome</Label>
              {editingUser && canEditUserName(editingUser) ? (
                <Input
                  id="username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="Nome do usuário"
                />
              ) : (
                <>
                  <Input
                    id="username"
                    value={editUsername}
                    disabled
                    placeholder="Nome do usuário"
                  />
                  <p className="text-xs text-muted-foreground">
                    Somente o Super Admin Master pode alterar nomes.
                  </p>
                </>
              )}
            </div>

            {/* Separator */}
            <div className="border-t pt-4">
              <Label htmlFor="editPassword" className="text-sm font-medium">
                Alterar Senha
              </Label>
              {editingUser && canChangePassword(editingUser) ? (
                <>
                  <p className="text-xs text-muted-foreground mb-2">
                    {editingUser.user_id === currentUser?.id
                      ? 'Altere sua própria senha abaixo.'
                      : 'Deixe em branco para manter a senha atual'
                    }
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="editPassword"
                        type={showEditPassword ? 'text' : 'password'}
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Nova senha (mín. 6 caracteres)"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                      >
                        {showEditPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      onClick={handleUpdatePassword}
                      disabled={savingPassword || !editPassword.trim() || editPassword.length < 6}
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      {savingPassword ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Salvar Senha'
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">
                  Somente o Super Admin pode alterar a senha de outros usuários.
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditModalOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="w-full sm:w-auto">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Toggle Confirmation */}
      <AlertDialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {roleAction?.action === 'promote'
                ? 'Promover a Administrador'
                : 'Revogar Permissão de Administrador'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {roleAction?.action === 'promote'
                ? `Tem certeza que deseja promover "${roleAction.user.username || roleAction.user.email}" a administrador? Este usuário terá acesso total ao painel administrativo.`
                : `Tem certeza que deseja revogar a permissão de administrador de "${roleAction?.user.username || roleAction?.user.email}"? Este usuário perderá acesso ao painel administrativo.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={togglingRole}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRoleToggle}
              disabled={togglingRole}
              className={roleAction?.action === 'revoke' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {togglingRole && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {roleAction?.action === 'promote' ? 'Promover' : 'Revogar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Admin Modal */}
      <Dialog open={addAdminModalOpen} onOpenChange={setAddAdminModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Administrador</DialogTitle>
            <DialogDescription>
              Insira os dados do novo administrador. Se definir uma senha, o usuário terá acesso imediato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newAdminName">Nome</Label>
              <Input
                id="newAdminName"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                placeholder="Nome do administrador"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newAdminEmail">Email *</Label>
              <Input
                id="newAdminEmail"
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newAdminPassword">Senha (opcional)</Label>
              <p className="text-xs text-muted-foreground">
                Se informada, o usuário pode fazer login imediatamente sem confirmar email.
              </p>
              <div className="relative">
                <Input
                  id="newAdminPassword"
                  type={showNewAdminPassword ? 'text' : 'password'}
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewAdminPassword(!showNewAdminPassword)}
                >
                  {showNewAdminPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddAdminModalOpen(false);
              setNewAdminEmail('');
              setNewAdminName('');
              setNewAdminPassword('');
              setShowNewAdminPassword(false);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleAddAdmin} disabled={addingAdmin || !newAdminEmail.trim()}>
              {addingAdmin && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <UserPlus className="h-4 w-4 mr-2" />
              {newAdminPassword ? 'Criar Admin' : 'Enviar Convite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário "{userToDelete?.username || userToDelete?.email}"?
              Esta ação não pode ser desfeita e todos os dados do usuário serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingUser}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              disabled={deletingUser}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deletingUser && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
