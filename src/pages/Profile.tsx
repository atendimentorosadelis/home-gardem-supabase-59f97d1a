import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Camera, Loader2, ArrowLeft, Save, Lock, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PushNotificationSettings } from '@/components/notifications/PushNotificationSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({ username: z.string().min(2).max(50).optional().or(z.literal('')) });
const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  confirmPassword: z.string().min(1),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'As senhas não coincidem', path: ['confirmPassword'] });

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ username?: string }>({});
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({});

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await (supabase as any).from('profiles').select('id, username, avatar_url').eq('user_id', user.id).maybeSingle();
        if (error) throw error;
        if (data) { setUsername(data.username || ''); setAvatarUrl(data.avatar_url); }
      } catch { toast({ title: 'Erro ao carregar perfil', variant: 'destructive' }); }
      finally { setIsLoading(false); }
    };
    fetchProfile();
  }, [user, toast]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = '';
    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrlWithTimestamp = `${publicUrl}?t=${Date.now()}`;
      await (supabase as any).from('profiles').update({ avatar_url: avatarUrlWithTimestamp }).eq('user_id', user.id);
      setAvatarUrl(avatarUrlWithTimestamp);
      toast({ title: 'Avatar atualizado!' });
    } catch { toast({ title: 'Erro ao enviar avatar', variant: 'destructive' }); }
    finally { setIsUploadingAvatar(false); }
  };

  const handleSave = async () => {
    const result = profileSchema.safeParse({ username });
    if (!result.success) { setErrors({ username: result.error.errors[0]?.message }); return; }
    setErrors({}); setIsSaving(true);
    try {
      await (supabase as any).from('profiles').update({ username: username.trim() || null }).eq('user_id', user?.id);
      toast({ title: 'Perfil atualizado!' });
    } catch { toast({ title: 'Erro ao salvar', variant: 'destructive' }); }
    finally { setIsSaving(false); }
  };

  const handleChangePassword = async () => {
    const result = passwordSchema.safeParse({ currentPassword, newPassword, confirmPassword });
    if (!result.success) {
      const fe: any = {};
      result.error.errors.forEach(e => { fe[e.path[0] as string] = e.message; });
      setPasswordErrors(fe); return;
    }
    setPasswordErrors({}); setIsChangingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user?.email || '', password: currentPassword });
      if (signInError) { setPasswordErrors({ currentPassword: 'Senha atual incorreta' }); return; }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      toast({ title: 'Senha alterada!' });
    } catch { toast({ title: 'Erro ao alterar senha', variant: 'destructive' }); }
    finally { setIsChangingPassword(false); }
  };

  if (isLoading) return <DashboardLayout><div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
          <div><h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1><p className="text-muted-foreground">Gerencie suas informações pessoais</p></div>
        </div>

        <Card className="border-border/50">
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" />Informações Pessoais</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">{user?.email?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploadingAvatar} className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {isUploadingAvatar ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Email</Label><Input value={user?.email || ''} disabled className="bg-muted/50" /></div>
              <div className="space-y-2"><Label>Nome</Label><Input value={username} onChange={e => setUsername(e.target.value)} className={errors.username ? 'border-destructive' : ''} />{errors.username && <p className="text-xs text-destructive">{errors.username}</p>}</div>
            </div>
            <div className="flex justify-end pt-4"><Button onClick={handleSave} disabled={isSaving} className="gap-2">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Salvar</Button></div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" />Alterar Senha</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Senha Atual</Label><div className="relative"><Input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={`pr-10 ${passwordErrors.currentPassword ? 'border-destructive' : ''}`} /><button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>{passwordErrors.currentPassword && <p className="text-xs text-destructive">{passwordErrors.currentPassword}</p>}</div>
            <div className="space-y-2"><Label>Nova Senha</Label><div className="relative"><Input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className={`pr-10 ${passwordErrors.newPassword ? 'border-destructive' : ''}`} /><button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>{passwordErrors.newPassword && <p className="text-xs text-destructive">{passwordErrors.newPassword}</p>}</div>
            <div className="space-y-2"><Label>Confirmar</Label><div className="relative"><Input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={`pr-10 ${passwordErrors.confirmPassword ? 'border-destructive' : ''}`} /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>{passwordErrors.confirmPassword && <p className="text-xs text-destructive">{passwordErrors.confirmPassword}</p>}</div>
            <div className="flex justify-end pt-4"><Button onClick={handleChangePassword} disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword} variant="secondary" className="gap-2">{isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}Alterar Senha</Button></div>
          </CardContent>
        </Card>

        <PushNotificationSettings />
      </div>
    </DashboardLayout>
  );
}
