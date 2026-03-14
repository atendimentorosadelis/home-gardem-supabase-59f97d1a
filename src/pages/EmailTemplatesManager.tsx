import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PermissionGate } from '@/components/PermissionGate';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { invokeEdgeFunction } from '@/lib/edge-functions';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Check, Eye, ArrowLeft, Sparkles, Palette, Leaf, Moon, Square, Sunrise, Send, Loader2, Bell, Newspaper } from 'lucide-react';
import React from 'react';

interface EmailTemplate { id: string; name: string; description: string | null; category: string; html_template: string; is_active: boolean; is_default: boolean; created_at: string; updated_at: string; }

const templateIcons: Record<string, React.ElementType> = {
  'Elegante Verde': Leaf, 'Minimalista Branco': Square, 'Nature Garden': Sparkles, 'Dark Professional': Moon, 'Moderno Flat': Palette,
  'Clássico Verde': Leaf, 'Moderno Minimalista': Square, 'Natureza Vibrante': Sparkles, 'Elegante Escuro': Moon, 'Jardim Floral': Palette, 'Aurora Botânica': Sunrise,
};

const templateColors: Record<string, string> = {
  'Elegante Verde': 'from-green-700 to-green-900', 'Minimalista Branco': 'from-gray-200 to-gray-400', 'Nature Garden': 'from-lime-500 to-green-600',
  'Dark Professional': 'from-gray-800 to-gray-950', 'Moderno Flat': 'from-amber-500 to-orange-600',
  'Clássico Verde': 'from-green-700 to-green-900', 'Moderno Minimalista': 'from-gray-200 to-gray-400', 'Natureza Vibrante': 'from-lime-500 to-green-600',
  'Elegante Escuro': 'from-gray-800 to-gray-950', 'Jardim Floral': 'from-amber-500 to-orange-600', 'Aurora Botânica': 'from-indigo-500 via-teal-500 to-green-500',
};

const darkThemeTemplates = ['Dark Professional', 'Elegante Escuro', 'Nature Garden', 'Natureza Vibrante', 'Aurora Botânica'];
const lightTextTemplates = ['Minimalista Branco', 'Moderno Minimalista'];

function EmailTemplatesManagerContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [socialSettings, setSocialSettings] = useState<Record<string, unknown>>({});

  // Test email state
  const [testEmail, setTestEmail] = useState('');
  const [testEmail2, setTestEmail2] = useState('');
  const [email1Enabled, setEmail1Enabled] = useState(true);
  const [email2Enabled, setEmail2Enabled] = useState(true);
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [sendingAdmin, setSendingAdmin] = useState(false);

  useEffect(() => {
    fetchTemplates();
    loadUserEmail();
  }, []);

  const loadUserEmail = async () => {
    if (!user) return;
    // Load current user email
    const { data } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data?.email) setTestEmail(data.email);

    // Load second admin email
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');
    
    if (adminRoles && adminRoles.length > 0) {
      const otherAdminIds = adminRoles
        .map(r => r.user_id)
        .filter(id => id !== user.id);
      
      if (otherAdminIds.length > 0) {
        const { data: otherProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', otherAdminIds[0])
          .maybeSingle();
        if (otherProfile?.email) setTestEmail2(otherProfile.email);
      }
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await invokeEdgeFunction<{ success: boolean; templates: EmailTemplate[]; socialSettings: Record<string, unknown>; error?: string }>('get-email-templates', {});
      if (error) throw error;
      if (data && data.success) { setTemplates(data.templates || []); setSocialSettings(data.socialSettings || {}); }
      else throw new Error(data?.error || 'Failed to fetch templates');
    } catch (error) { console.error('Error fetching templates:', error); toast.error('Erro ao carregar templates'); } finally { setLoading(false); }
  };

  const setAsDefault = async (templateId: string) => {
    setUpdatingId(templateId);
    try {
      const { data, error } = await invokeEdgeFunction<{ success: boolean; error?: string }>('update-email-template', { templateId });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to set default template');
      // Update local state without re-fetching to avoid scroll jump
      setTemplates(prev => prev.map(t => ({ ...t, is_default: t.id === templateId })));
      toast.success('Template ativado com sucesso!');
    } catch (error) { toast.error('Erro ao definir template padrão'); } finally { setUpdatingId(null); }
  };

  const sendTestEmail = async (type: 'newsletter' | 'admin-notification') => {
    const emails = [testEmail.trim(), testEmail2.trim()].filter(Boolean);
    if (emails.length === 0) {
      toast.error('Informe pelo menos um e-mail de destino');
      return;
    }

    const setter = type === 'newsletter' ? setSendingNewsletter : setSendingAdmin;
    setter(true);

    try {
      const { data, error } = await invokeEdgeFunction<{ success: boolean; error?: string }>(
        'send-test-email',
        { type, recipientEmails: emails },
        true
      );

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to send test email');

      toast.success(
        type === 'newsletter'
          ? `Newsletter de teste enviada para ${emails.join(', ')}`
          : `Notificação admin de teste enviada para ${emails.join(', ')}`
      );
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error(`Erro ao enviar e-mail de teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setter(false);
    }
  };

  const generateDynamicSocialIcons = () => {
    const platforms = ['facebook', 'instagram', 'twitter', 'youtube', 'linkedin', 'pinterest', 'tiktok'];
    const iconUrls: Record<string, string> = { facebook: 'https://homegardenmanual.lovable.app/images/social/facebook.svg', instagram: 'https://homegardenmanual.lovable.app/images/social/instagram.svg', twitter: 'https://homegardenmanual.lovable.app/images/social/twitter.svg', youtube: 'https://homegardenmanual.lovable.app/images/social/youtube.svg', linkedin: 'https://homegardenmanual.lovable.app/images/social/linkedin.svg', pinterest: 'https://homegardenmanual.lovable.app/images/social/pinterest.svg', tiktok: 'https://homegardenmanual.lovable.app/images/social/tiktok.svg' };
    const altNames: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', twitter: 'X', youtube: 'YouTube', linkedin: 'LinkedIn', pinterest: 'Pinterest', tiktok: 'TikTok' };
    const enabledPlatforms = platforms.filter(p => socialSettings[`${p}_enabled`] === true);
    if (enabledPlatforms.length === 0) return '<!-- Nenhuma rede social habilitada -->';
    return enabledPlatforms.map(platform => {
      const url = socialSettings[platform] as string; const hasUrl = url && url.trim() !== '';
      const iconStyle = `display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.15); margin: 0 6px; text-decoration: none;`;
      if (hasUrl) return `<a href="${url}" style="${iconStyle}"><img src="${iconUrls[platform]}" alt="${altNames[platform]}" width="20" height="20" style="display: block;" /></a>`;
      else return `<span style="${iconStyle} opacity: 0.6;"><img src="${iconUrls[platform]}" alt="${altNames[platform]}" width="20" height="20" style="display: block;" /></span>`;
    }).join('');
  };

  const getPreviewHtml = (template: EmailTemplate) => {
    const isDarkTheme = darkThemeTemplates.includes(template.name);
    const logoUrl = isDarkTheme ? 'https://homegardenmanual.lovable.app/images/logo-email-dark.png' : 'https://homegardenmanual.lovable.app/images/logo-email-light.png';
    const sampleData = { name: 'Maria Silva', content: '<p>Muito obrigado por entrar em contato conosco!</p><p>Recebemos sua mensagem e nossa equipe está analisando sua solicitação.</p>', original_message: 'Olá, gostaria de saber mais sobre como cuidar de plantas suculentas.', year: new Date().getFullYear().toString() };
    const socialHtml = generateDynamicSocialIcons();
    return template.html_template.replace(/\{\{logo_url\}\}/g, logoUrl).replace(/\{\{site_name\}\}/g, 'Home Garden Manual').replace(/\{\{name\}\}/g, sampleData.name).replace(/\{\{user_name\}\}/g, sampleData.name).replace(/\{\{content\}\}/g, sampleData.content).replace(/\{\{original_message\}\}/g, sampleData.original_message).replace(/\{\{year\}\}/g, sampleData.year).replace(/\{\{email\}\}/g, 'exemplo@email.com').replace(/\{\{unsubscribe_url\}\}/g, 'https://homegardenmanual.lovable.app/unsubscribe?email=exemplo@email.com').replace(/\{\{social_icons\}\}/g, socialHtml);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between"><div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => navigate('/admin/settings')} className="shrink-0"><ArrowLeft className="h-4 w-4" /></Button><div><h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Mail className="h-6 w-6 text-primary" />Templates de E-mail</h1><p className="text-muted-foreground">Escolha o template padrão para respostas de contato</p></div></div></div>

        {/* Test Email Section */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Enviar E-mail de Teste
            </CardTitle>
            <CardDescription>
              Dispare um e-mail de teste para verificar como os templates estão chegando na sua caixa de entrada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">E-mail Admin 1</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="admin1@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test-email-2">E-mail Admin 2 (opcional)</Label>
                <Input
                  id="test-email-2"
                  type="email"
                  placeholder="admin2@email.com"
                  value={testEmail2}
                  onChange={(e) => setTestEmail2(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => sendTestEmail('newsletter')}
                disabled={sendingNewsletter || (!testEmail.trim() && !testEmail2.trim())}
                variant="outline"
                className="gap-2"
              >
                {sendingNewsletter ? <Loader2 className="h-4 w-4 animate-spin" /> : <Newspaper className="h-4 w-4" />}
                Testar Newsletter
              </Button>
              <Button
                onClick={() => sendTestEmail('admin-notification')}
                disabled={sendingAdmin || (!testEmail.trim() && !testEmail2.trim())}
                variant="outline"
                className="gap-2"
              >
                {sendingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                Testar Notificação Admin
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Os e-mails de teste usam o mesmo template utilizado nos envios reais de newsletter e notificações de artigos gerados.
            </p>
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5].map((i) => <Card key={i} className="overflow-hidden"><Skeleton className="h-40 w-full" /><CardContent className="p-4 space-y-3"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-9 w-full" /></CardContent></Card>)}</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => {
              const IconComponent = templateIcons[template.name] || Mail;
              const gradientClass = templateColors[template.name] || 'from-primary to-primary/80';
              const isUpdating = updatingId === template.id;
              return (
                <Card key={template.id} className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${template.is_default ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                  <div className="h-40 relative overflow-hidden bg-gray-100">
                    <iframe srcDoc={getPreviewHtml(template)} className="w-[600px] h-[800px] transform scale-[0.22] origin-top-left pointer-events-none" title={`Preview ${template.name}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Badge className={`${gradientClass} bg-gradient-to-r text-white border-0 shadow-md`}><IconComponent className="h-3 w-3 mr-1" />{template.name}</Badge>
                      {template.is_default && <Badge className="bg-primary text-primary-foreground border-0 shadow-md"><Check className="h-3 w-3 mr-1" />Ativo</Badge>}
                    </div>
                  </div>
                  <div className={`h-12 bg-gradient-to-br ${gradientClass} px-4 flex items-center`}><div className={lightTextTemplates.includes(template.name) ? 'text-gray-800' : 'text-white'}><h3 className="font-semibold text-lg">{template.name}</h3></div></div>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreviewTemplate(template)}><Eye className="h-4 w-4 mr-1" />Visualizar</Button>
                      {!template.is_default ? <Button size="sm" className="flex-1" onClick={() => setAsDefault(template.id)} disabled={isUpdating}>{isUpdating ? <span className="animate-pulse">...</span> : <><Check className="h-4 w-4 mr-1" />Usar Este</>}</Button> : <Button size="sm" className="flex-1" variant="secondary" disabled><Check className="h-4 w-4 mr-1" />Em Uso</Button>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="bg-muted/50"><CardContent className="p-6"><div className="flex gap-4"><div className="shrink-0"><div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><Mail className="h-5 w-5 text-primary" /></div></div><div><h4 className="font-medium text-foreground mb-1">Como funciona?</h4><p className="text-sm text-muted-foreground">O template escolhido será usado automaticamente para todas as respostas de mensagens de contato, tanto manuais quanto automáticas (IA).</p></div></div></CardContent></Card>
      </div>

      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5" />Preview: {previewTemplate?.name}</DialogTitle><DialogDescription>Visualização de como o e-mail será exibido para o destinatário</DialogDescription></DialogHeader>
          <div className="flex-1 overflow-auto bg-gray-100 rounded-lg p-4 min-h-[500px]">{previewTemplate && <iframe srcDoc={getPreviewHtml(previewTemplate)} className="w-full h-full min-h-[500px] bg-white rounded shadow-sm" title="Email Preview" />}</div>
          <div className="flex justify-end gap-2 pt-4 border-t"><Button variant="outline" onClick={() => setPreviewTemplate(null)}>Fechar</Button>{previewTemplate && !previewTemplate.is_default && <Button onClick={() => { setAsDefault(previewTemplate.id); setPreviewTemplate(null); }}><Check className="h-4 w-4 mr-1" />Usar Este Template</Button>}</div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export default function EmailTemplatesManager() {
  return (
    <PermissionGate permission="can_manage_email_templates">
      <EmailTemplatesManagerContent />
    </PermissionGate>
  );
}
