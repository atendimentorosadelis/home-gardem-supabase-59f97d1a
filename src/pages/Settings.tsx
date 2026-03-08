import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PermissionGate } from '@/components/PermissionGate';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings as SettingsIcon, Globe, Bell, Building2, Loader2, Save, Search, Image, Upload, X, Facebook, Instagram, Twitter, Youtube, Linkedin, DollarSign, ExternalLink, AlertTriangle, CheckCircle2, MessageSquare, Sparkles, Cpu, Cloud } from 'lucide-react';
import { AIIcon } from '@/components/AIIcon';
import { PushNotificationSettings } from '@/components/notifications/PushNotificationSettings';
import { PinterestIcon, TikTokIcon } from '@/components/SocialLinks';

interface SiteSettings {
  site_name: string;
  site_description: string;
  contact_email: string;
  contact_phone: string;
  address: string;
}

interface SocialSettings {
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
  linkedin: string;
  pinterest: string;
  tiktok: string;
  facebook_enabled: boolean;
  instagram_enabled: boolean;
  twitter_enabled: boolean;
  youtube_enabled: boolean;
  linkedin_enabled: boolean;
  pinterest_enabled: boolean;
  tiktok_enabled: boolean;
}

interface GeneralSettings {
  language: string;
  timezone: string;
  date_format: string;
}

interface NotificationSettings {
  email_on_new_article: boolean;
  email_on_new_user: boolean;
  push_enabled: boolean;
}

interface AutoReplySettings {
  enabled: boolean;
  prompt: string;
}

interface AISettings {
  image_provider: 'replicate' | 'cloudflare' | 'auto';
}

interface SEOSettings {
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
  og_type: string;
  twitter_card: string;
  twitter_site: string;
  twitter_image: string;
  favicon_url: string;
  robots_txt: string;
  google_analytics_id: string;
  google_search_console: string;
  facebook_pixel_id: string;
  facebook_pixel_enabled: boolean;
  adsense_enabled: boolean;
  adsense_publisher_id: string;
  ads_txt_content: string;
}

function SettingsContent() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const ogImageInputRef = useRef<HTMLInputElement>(null);

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    language: i18n.language || 'pt-BR',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    date_format: 'dd/MM/yyyy',
  });

  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    site_name: 'Home Garden Manual',
    site_description: 'Discover enchanting home decoration inspiration, modern architecture ideas, interior design trends, and expert gardening tips. Home Garden Manual is your ultimate digital haven — featuring practical guides, step-by-step tutorials, and curated trends to transform every corner of your home and garden into a warm, sophisticated, and beautifully personalized living space.',
    contact_email: '',
    contact_phone: '',
    address: '',
  });

  const [socialSettings, setSocialSettings] = useState<SocialSettings>({
    facebook: '', instagram: '', twitter: '', youtube: '', linkedin: '', pinterest: '', tiktok: '',
    facebook_enabled: true, instagram_enabled: true, twitter_enabled: true, youtube_enabled: true,
    linkedin_enabled: true, pinterest_enabled: true, tiktok_enabled: true,
  });
  const [savingSocial, setSavingSocial] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_on_new_article: true, email_on_new_user: true, push_enabled: true,
  });

  const [autoReplySettings, setAutoReplySettings] = useState<AutoReplySettings>({
    enabled: false,
    prompt: 'Você é um assistente do site Home Garden Manual, especializado em jardinagem, plantas e decoração. Responda de forma profissional e amigável em português brasileiro.',
  });
  const [savingAutoReply, setSavingAutoReply] = useState(false);
  const [loadingAutoReply, setLoadingAutoReply] = useState(true);

  const [seoSettings, setSeoSettings] = useState<SEOSettings>({
    meta_title: 'Home Garden - Dicas de Jardinagem e Plantas',
    meta_description: 'Home Garden - Dicas de jardinagem, plantas e decoração para transformar seu lar em um verdadeiro jardim.',
    meta_keywords: 'jardinagem, plantas, decoração, jardim, flores, paisagismo',
    og_title: 'Home Garden', og_description: 'Home Garden - Dicas de jardinagem, plantas e decoração',
    og_image: '', og_type: 'website', twitter_card: 'summary_large_image',
    twitter_site: '@HomeGarden', twitter_image: '', favicon_url: '/favicon.png',
    robots_txt: 'User-agent: *\nAllow: /\nSitemap: https://homegardenmanual.lovable.app/sitemap.xml',
    google_analytics_id: '', google_search_console: '',
    facebook_pixel_id: '', facebook_pixel_enabled: false,
    adsense_enabled: false, adsense_publisher_id: '',
    ads_txt_content: 'google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0',
  });

  const [loadingSocial, setLoadingSocial] = useState(true);
  const [loadingSeo, setLoadingSeo] = useState(true);

  const [aiSettings, setAiSettings] = useState<AISettings>({ image_provider: 'auto' });
  const [savingAi, setSavingAi] = useState(false);
  const [loadingAi, setLoadingAi] = useState(true);

  const defaultSeoSettings: SEOSettings = {
    meta_title: 'Home Garden - Gardening Tips and Plants',
    meta_description: 'Home Garden - Gardening tips, plants, and decoration to transform your home into a beautiful garden.',
    meta_keywords: 'gardening, plants, decoration, garden, flowers, landscaping, indoor plants',
    og_title: 'Home Garden Manual', og_description: 'Home Garden - Gardening tips, plants, and home decoration',
    og_image: '', og_type: 'website', twitter_card: 'summary_large_image',
    twitter_site: '@HomeGarden', twitter_image: '', favicon_url: '/favicon.png',
    robots_txt: 'User-agent: *\nAllow: /\nSitemap: https://homegardenmanual.com/sitemap.xml',
    google_analytics_id: '', google_search_console: '',
    facebook_pixel_id: '', facebook_pixel_enabled: false,
    adsense_enabled: false, adsense_publisher_id: '',
    ads_txt_content: 'google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0',
  };

  // Load SEO settings
  useEffect(() => {
    const loadOrCreateSeoSettings = async () => {
      try {
        const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'seo_settings').maybeSingle();
        if (error && error.code !== 'PGRST116') console.error('Error loading SEO settings:', error);
        if (data?.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
          const value = data.value as Record<string, unknown>;
          setSeoSettings(prev => ({
            ...prev,
            meta_title: (value.meta_title as string) || prev.meta_title,
            meta_description: (value.meta_description as string) || prev.meta_description,
            meta_keywords: (value.meta_keywords as string) || prev.meta_keywords,
            og_title: (value.og_title as string) || prev.og_title,
            og_description: (value.og_description as string) || prev.og_description,
            og_image: (value.og_image as string) || prev.og_image,
            og_type: (value.og_type as string) || prev.og_type,
            twitter_card: (value.twitter_card as string) || prev.twitter_card,
            twitter_site: (value.twitter_site as string) || prev.twitter_site,
            twitter_image: (value.twitter_image as string) || prev.twitter_image,
            favicon_url: (value.favicon_url as string) || prev.favicon_url,
            robots_txt: (value.robots_txt as string) || prev.robots_txt,
            google_analytics_id: (value.google_analytics_id as string) || prev.google_analytics_id,
            google_search_console: (value.google_search_console as string) || prev.google_search_console,
            facebook_pixel_id: (value.facebook_pixel_id as string) || prev.facebook_pixel_id,
            facebook_pixel_enabled: typeof value.facebook_pixel_enabled === 'boolean' ? value.facebook_pixel_enabled : prev.facebook_pixel_enabled,
            adsense_enabled: typeof value.adsense_enabled === 'boolean' ? value.adsense_enabled : prev.adsense_enabled,
            adsense_publisher_id: (value.adsense_publisher_id as string) || prev.adsense_publisher_id,
            ads_txt_content: (value.ads_txt_content as string) || prev.ads_txt_content,
          }));
        } else {
          const savedSeo = localStorage.getItem('admin_seo_settings');
          const settingsToSave = savedSeo ? JSON.parse(savedSeo) : defaultSeoSettings;
          await supabase.from('site_settings').insert({ key: 'seo_settings', value: settingsToSave });
          setSeoSettings(settingsToSave);
        }
      } catch (error) {
        console.error('Error loading SEO settings:', error);
        const savedSeo = localStorage.getItem('admin_seo_settings');
        if (savedSeo) setSeoSettings(JSON.parse(savedSeo));
      } finally {
        setLoadingSeo(false);
      }
    };
    loadOrCreateSeoSettings();
  }, []);

  // Load site settings from DB then localStorage fallback
  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        const { data } = await supabase.from('site_settings').select('value').eq('key', 'site_info').maybeSingle();
        if (data?.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
          const value = data.value as Record<string, unknown>;
          setSiteSettings(prev => ({
            ...prev,
            site_name: (value.site_name as string) || prev.site_name,
            site_description: (value.site_description as string) || prev.site_description,
            contact_email: (value.contact_email as string) || prev.contact_email,
            contact_phone: (value.contact_phone as string) || prev.contact_phone,
            address: (value.address as string) || prev.address,
          }));
        } else {
          const savedSite = localStorage.getItem('admin_site_settings');
          if (savedSite) setSiteSettings(JSON.parse(savedSite));
        }
      } catch (e) { console.error('Error loading site settings:', e); }
    };
    loadSiteSettings();

    const savedGeneral = localStorage.getItem('admin_general_settings');
    const savedNotifications = localStorage.getItem('admin_notification_settings');
    if (savedGeneral) setGeneralSettings(JSON.parse(savedGeneral));
    if (savedNotifications) setNotificationSettings(JSON.parse(savedNotifications));
  }, []);

  // Load social settings
  useEffect(() => {
    const loadSocialSettings = async () => {
      try {
        const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'social_links').maybeSingle();
        if (error && error.code !== 'PGRST116') console.error('Error loading social settings:', error);
        if (data?.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
          const value = data.value as Record<string, unknown>;
          setSocialSettings({
            facebook: (value.facebook as string) || '', instagram: (value.instagram as string) || '',
            twitter: (value.twitter as string) || '', youtube: (value.youtube as string) || '',
            linkedin: (value.linkedin as string) || '', pinterest: (value.pinterest as string) || '',
            tiktok: (value.tiktok as string) || '',
            facebook_enabled: value.facebook_enabled !== false, instagram_enabled: value.instagram_enabled !== false,
            twitter_enabled: value.twitter_enabled !== false, youtube_enabled: value.youtube_enabled !== false,
            linkedin_enabled: value.linkedin_enabled !== false, pinterest_enabled: value.pinterest_enabled !== false,
            tiktok_enabled: value.tiktok_enabled !== false,
          });
          localStorage.setItem('admin_social_settings', JSON.stringify(data.value));
        }
      } catch (error) { console.error('Error loading social settings:', error); }
      finally { setLoadingSocial(false); }
    };
    loadSocialSettings();
  }, []);

  // Load auto-reply settings
  useEffect(() => {
    const loadAutoReplySettings = async () => {
      try {
        const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'auto_reply_config').maybeSingle();
        if (error && error.code !== 'PGRST116') console.error('Error loading auto-reply settings:', error);
        if (data?.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
          const value = data.value as { enabled?: boolean; prompt?: string };
          setAutoReplySettings({ enabled: value.enabled ?? false, prompt: value.prompt ?? autoReplySettings.prompt });
        }
      } catch (error) { console.error('Error loading auto-reply settings:', error); }
      finally { setLoadingAutoReply(false); }
    };
    loadAutoReplySettings();
  }, []);

  // Load AI settings
  useEffect(() => {
    const loadAiSettings = async () => {
      try {
        const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'ai_settings').maybeSingle();
        if (error && error.code !== 'PGRST116') console.error('Error loading AI settings:', error);
        if (data?.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
          const value = data.value as { image_provider?: string };
          setAiSettings({ image_provider: (value.image_provider as AISettings['image_provider']) || 'auto' });
        }
      } catch (error) { console.error('Error loading AI settings:', error); }
      finally { setLoadingAi(false); }
    };
    loadAiSettings();
  }, []);

  const handleSaveAutoReply = async () => {
    setSavingAutoReply(true);
    try {
      const payload = { enabled: autoReplySettings.enabled, prompt: autoReplySettings.prompt };
      const { data: existing } = await supabase.from('site_settings').select('id').eq('key', 'auto_reply_config').maybeSingle();
      if (existing) {
        const { error } = await supabase.from('site_settings').update({ value: payload as any, updated_at: new Date().toISOString() }).eq('key', 'auto_reply_config');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert({ key: 'auto_reply_config', value: payload as any });
        if (error) throw error;
      }
      toast.success('Configurações de resposta automática salvas com sucesso!');
    } catch (error) { console.error('Error saving auto-reply settings:', error); toast.error('Erro ao salvar configurações'); }
    finally { setSavingAutoReply(false); }
  };

  const handleSaveAi = async () => {
    setSavingAi(true);
    try {
      const { data: existing } = await supabase.from('site_settings').select('id').eq('key', 'ai_settings').maybeSingle();
      if (existing) {
        const { error } = await supabase.from('site_settings').update({ value: aiSettings as any, updated_at: new Date().toISOString() }).eq('key', 'ai_settings');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert({ key: 'ai_settings', value: aiSettings as any });
        if (error) throw error;
      }
      toast.success('Configurações de IA salvas com sucesso!');
    } catch (error) { console.error('Error saving AI settings:', error); toast.error('Erro ao salvar configurações'); }
    finally { setSavingAi(false); }
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      if (generalSettings.language !== i18n.language) await i18n.changeLanguage(generalSettings.language);
      localStorage.setItem('admin_general_settings', JSON.stringify(generalSettings));
      toast.success('Configurações gerais salvas com sucesso!');
    } catch (error) { console.error('Error saving general settings:', error); toast.error('Erro ao salvar configurações'); }
    finally { setSaving(false); }
  };

  const handleSaveSite = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase.from('site_settings').select('id').eq('key', 'site_info').maybeSingle();
      if (existing) {
        const { error } = await supabase.from('site_settings').update({ value: siteSettings as any, updated_at: new Date().toISOString() }).eq('key', 'site_info');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert({ key: 'site_info', value: siteSettings as any });
        if (error) throw error;
      }
      localStorage.setItem('admin_site_settings', JSON.stringify(siteSettings));
      toast.success('Configurações do site salvas com sucesso!');
    } catch (error) { console.error('Error saving site settings:', error); toast.error('Erro ao salvar configurações'); }
    finally { setSaving(false); }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      localStorage.setItem('admin_notification_settings', JSON.stringify(notificationSettings));
      toast.success('Configurações de notificações salvas com sucesso!');
    } catch (error) { console.error('Error saving notification settings:', error); toast.error('Erro ao salvar configurações'); }
    finally { setSaving(false); }
  };

  const handleSaveSeo = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase.from('site_settings').select('id').eq('key', 'seo_settings').maybeSingle();
      if (existing) {
        const { error } = await supabase.from('site_settings').update({ value: seoSettings as any, updated_at: new Date().toISOString() }).eq('key', 'seo_settings');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('site_settings').insert({ key: 'seo_settings', value: seoSettings as any });
        if (error) throw error;
      }
      localStorage.setItem('admin_seo_settings', JSON.stringify(seoSettings));
      document.title = seoSettings.meta_title;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) metaDescription.setAttribute('content', seoSettings.meta_description);
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', seoSettings.og_title);
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) ogDescription.setAttribute('content', seoSettings.og_description);
      if (seoSettings.og_image) { const ogImage = document.querySelector('meta[property="og:image"]'); if (ogImage) ogImage.setAttribute('content', seoSettings.og_image); }
      const twitterSite = document.querySelector('meta[name="twitter:site"]');
      if (twitterSite) twitterSite.setAttribute('content', seoSettings.twitter_site);
      if (seoSettings.twitter_image) { const twitterImage = document.querySelector('meta[name="twitter:image"]'); if (twitterImage) twitterImage.setAttribute('content', seoSettings.twitter_image); }
      if (seoSettings.favicon_url) { const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement; if (favicon) favicon.href = seoSettings.favicon_url; }
      toast.success('Configurações de SEO salvas com sucesso!');
    } catch (error) { console.error('Error saving SEO settings:', error); toast.error('Erro ao salvar configurações'); }
    finally { setSaving(false); }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Por favor, selecione uma imagem válida'); return; }
    if (file.size > 500 * 1024) { toast.error('O favicon deve ter no máximo 500KB'); return; }
    setUploadingFavicon(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `favicon-${Date.now()}.${fileExt}`;
      const filePath = `seo/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('site-assets').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(filePath);
      setSeoSettings({ ...seoSettings, favicon_url: publicUrl });
      toast.success('Favicon enviado com sucesso!');
    } catch (error) { console.error('Error uploading favicon:', error); toast.error('Erro ao enviar favicon'); }
    finally { setUploadingFavicon(false); }
  };

  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Por favor, selecione uma imagem válida'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('A imagem deve ter no máximo 2MB'); return; }
    setUploadingOgImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `og-image-${Date.now()}.${fileExt}`;
      const filePath = `seo/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('site-assets').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(filePath);
      setSeoSettings({ ...seoSettings, og_image: publicUrl, twitter_image: publicUrl });
      toast.success('Imagem OG enviada com sucesso!');
    } catch (error) { console.error('Error uploading OG image:', error); toast.error('Erro ao enviar imagem'); }
    finally { setUploadingOgImage(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <SettingsIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-sm text-muted-foreground">Gerencie as configurações do sistema</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="general" className="gap-2"><Globe className="h-4 w-4 hidden sm:inline" /><span className="hidden sm:inline">Gerais</span><span className="sm:hidden">Geral</span></TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4 hidden sm:inline" /><span className="hidden sm:inline">Notificações</span><span className="sm:hidden">Notif.</span></TabsTrigger>
            <TabsTrigger value="site" className="gap-2"><Building2 className="h-4 w-4 hidden sm:inline" />Site</TabsTrigger>
            <TabsTrigger value="ai" className="gap-2"><Sparkles className="h-4 w-4 hidden sm:inline" />IA</TabsTrigger>
            <TabsTrigger value="seo" className="gap-2"><Search className="h-4 w-4 hidden sm:inline" />SEO</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Configurações Gerais</CardTitle><CardDescription>Configure idioma, fuso horário e formato de data</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select value={generalSettings.language} onValueChange={(value) => setGeneralSettings({ ...generalSettings, language: value })}>
                      <SelectTrigger id="language"><SelectValue placeholder="Selecione o idioma" /></SelectTrigger>
                      <SelectContent><SelectItem value="pt-BR">Português (Brasil)</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="es">Español</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <Select value={generalSettings.timezone} onValueChange={(value) => setGeneralSettings({ ...generalSettings, timezone: value })}>
                      <SelectTrigger id="timezone"><SelectValue placeholder="Selecione o fuso horário" /></SelectTrigger>
                      <SelectContent><SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem><SelectItem value="America/New_York">New York (GMT-5)</SelectItem><SelectItem value="Europe/London">London (GMT+0)</SelectItem><SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem><SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_format">Formato de Data</Label>
                    <Select value={generalSettings.date_format} onValueChange={(value) => setGeneralSettings({ ...generalSettings, date_format: value })}>
                      <SelectTrigger id="date_format"><SelectValue placeholder="Selecione o formato" /></SelectTrigger>
                      <SelectContent><SelectItem value="dd/MM/yyyy">DD/MM/AAAA</SelectItem><SelectItem value="MM/dd/yyyy">MM/DD/AAAA</SelectItem><SelectItem value="yyyy-MM-dd">AAAA-MM-DD</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveGeneral} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Salvar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="mt-6 space-y-6">
            <Card>
              <CardHeader><CardTitle>Notificações por Email</CardTitle><CardDescription>Configure quando receber notificações por email</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5"><Label>Novo artigo publicado</Label><p className="text-sm text-muted-foreground">Receber email quando um artigo for publicado</p></div>
                  <Switch checked={notificationSettings.email_on_new_article} onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, email_on_new_article: checked })} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5"><Label>Novo usuário cadastrado</Label><p className="text-sm text-muted-foreground">Receber email quando um novo usuário se cadastrar</p></div>
                  <Switch checked={notificationSettings.email_on_new_user} onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, email_on_new_user: checked })} />
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveNotifications} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Salvar</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Notificações Push</CardTitle><CardDescription>Configure as notificações push do navegador</CardDescription></CardHeader>
              <CardContent><PushNotificationSettings /></CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Respostas Automáticas de Contato</CardTitle>
                <CardDescription>Configure respostas automáticas com IA para mensagens de contato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingAutoReply ? (
                  <div className="flex items-center justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2"><AIIcon size="sm" />Ativar respostas automáticas com IA</Label>
                        <p className="text-sm text-muted-foreground">Quando ativado, novas mensagens de contato serão respondidas automaticamente por e-mail usando IA</p>
                      </div>
                      <Switch checked={autoReplySettings.enabled} onCheckedChange={(checked) => setAutoReplySettings({ ...autoReplySettings, enabled: checked })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ai_prompt">Instruções para a IA</Label>
                      <Textarea id="ai_prompt" value={autoReplySettings.prompt} onChange={(e) => setAutoReplySettings({ ...autoReplySettings, prompt: e.target.value })} placeholder="Descreva como a IA deve responder às mensagens..." rows={4} className="resize-none" />
                      <p className="text-xs text-muted-foreground">Esta instrução será usada como base para gerar respostas personalizadas</p>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleSaveAutoReply} disabled={savingAutoReply}>{savingAutoReply ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Salvar</Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Settings */}
          <TabsContent value="ai" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />Configurações de IA</CardTitle>
                <CardDescription>Configure os provedores de inteligência artificial para geração de conteúdo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingAi ? (
                  <div className="flex items-center justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-semibold flex items-center gap-2"><Image className="h-4 w-4" />Provedor de Geração de Imagens</Label>
                        <p className="text-sm text-muted-foreground mt-1">Escolha qual serviço será usado para gerar imagens de artigos</p>
                      </div>
                      <div className="grid gap-3">
                        {/* Auto */}
                        <div className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${aiSettings.image_provider === 'auto' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'}`} onClick={() => setAiSettings({ ...aiSettings, image_provider: 'auto' })}>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${aiSettings.image_provider === 'auto' ? 'border-primary' : 'border-muted-foreground'}`}>{aiSettings.image_provider === 'auto' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}</div>
                          <div className="flex-1"><div className="flex items-center gap-2"><span className="font-medium">Automático</span><span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Recomendado</span></div><p className="text-sm text-muted-foreground mt-1">Tenta Replicate primeiro. Se falhar, usa Cloudflare como fallback.</p></div>
                        </div>
                        {/* Replicate */}
                        <div className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${aiSettings.image_provider === 'replicate' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'}`} onClick={() => setAiSettings({ ...aiSettings, image_provider: 'replicate' })}>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${aiSettings.image_provider === 'replicate' ? 'border-primary' : 'border-muted-foreground'}`}>{aiSettings.image_provider === 'replicate' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}</div>
                          <div className="flex-1"><div className="flex items-center gap-2"><Cpu className="h-4 w-4" /><span className="font-medium">Replicate (Flux)</span></div><p className="text-sm text-muted-foreground mt-1">Modelo Flux-schnell de alta qualidade. Requer REPLICATE_API_TOKEN.</p></div>
                        </div>
                        {/* Cloudflare */}
                        <div className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${aiSettings.image_provider === 'cloudflare' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'}`} onClick={() => setAiSettings({ ...aiSettings, image_provider: 'cloudflare' })}>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${aiSettings.image_provider === 'cloudflare' ? 'border-primary' : 'border-muted-foreground'}`}>{aiSettings.image_provider === 'cloudflare' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}</div>
                          <div className="flex-1"><div className="flex items-center gap-2"><Cloud className="h-4 w-4" /><span className="font-medium">Cloudflare Workers AI</span></div><p className="text-sm text-muted-foreground mt-1">Stable Diffusion XL gratuito. Requer CLOUDFLARE_AI_WORKER_URL.</p></div>
                        </div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 text-sm">
                        <p className="font-medium mb-2">Requisitos de Configuração:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li><code className="text-xs bg-muted px-1 rounded">REPLICATE_API_TOKEN</code> - Token da API Replicate</li>
                          <li><code className="text-xs bg-muted px-1 rounded">CLOUDFLARE_AI_WORKER_URL</code> - URL do Worker Cloudflare</li>
                        </ul>
                        <p className="mt-2 text-muted-foreground">Os secrets devem ser configurados no Supabase externo.</p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button onClick={handleSaveAi} disabled={savingAi}>{savingAi ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Salvar</Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Site Settings */}
          <TabsContent value="site" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Configurações do Site</CardTitle><CardDescription>Configure as informações do site e redes sociais</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="site_name">Nome do Site</Label><Input id="site_name" value={siteSettings.site_name} onChange={(e) => setSiteSettings({ ...siteSettings, site_name: e.target.value })} placeholder="Nome do site" /></div>
                  <div className="space-y-2"><Label htmlFor="contact_email">Email de Contato</Label><Input id="contact_email" type="email" value={siteSettings.contact_email} onChange={(e) => setSiteSettings({ ...siteSettings, contact_email: e.target.value })} placeholder="contato@exemplo.com" /></div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Telefone</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      value={siteSettings.contact_phone}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length > 11) value = value.slice(0, 11);
                        if (value.length > 0) {
                          value = '(' + value;
                          if (value.length > 3) value = value.slice(0, 3) + ') ' + value.slice(3);
                          if (value.length > 10) value = value.slice(0, 10) + '-' + value.slice(10);
                        }
                        setSiteSettings({ ...siteSettings, contact_phone: value });
                      }}
                      placeholder="(31) 97329-0745"
                      maxLength={15}
                    />
                  </div>
                  <div className="space-y-2"><Label htmlFor="address">Endereço</Label><Input id="address" value={siteSettings.address} onChange={(e) => setSiteSettings({ ...siteSettings, address: e.target.value })} placeholder="Endereço completo" /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="site_description">Descrição do Site</Label><Textarea id="site_description" value={siteSettings.site_description} onChange={(e) => setSiteSettings({ ...siteSettings, site_description: e.target.value })} placeholder="Descrição do site para SEO" rows={3} /></div>
                <div className="flex justify-end"><Button onClick={handleSaveSite} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Salvar Informações</Button></div>
              </CardContent>
            </Card>

            {/* OG Settings */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Image className="h-5 w-5" />Open Graph (Compartilhamento)</CardTitle>
                <CardDescription>Configure como seu site aparece quando compartilhado nas redes sociais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="site_og_title">Título OG</Label>
                    <Input id="site_og_title" value={seoSettings.og_title} onChange={(e) => setSeoSettings({ ...seoSettings, og_title: e.target.value })} placeholder="Título para compartilhamento" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site_og_type">Tipo</Label>
                    <Select value={seoSettings.og_type} onValueChange={(value) => setSeoSettings({ ...seoSettings, og_type: value })}>
                      <SelectTrigger id="site_og_type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="article">Artigo</SelectItem>
                        <SelectItem value="blog">Blog</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site_og_description">Descrição OG</Label>
                  <Textarea id="site_og_description" value={seoSettings.og_description} onChange={(e) => setSeoSettings({ ...seoSettings, og_description: e.target.value })} placeholder="Descrição para compartilhamento" rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Imagem OG (1200x630 recomendado)</Label>
                  <div className="flex items-start gap-4">
                    {seoSettings.og_image ? (
                      <div className="relative">
                        <img src={seoSettings.og_image} alt="OG Image" className="w-48 h-24 object-cover rounded-lg border" />
                        <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => setSeoSettings({ ...seoSettings, og_image: '', twitter_image: '' })}><X className="h-3 w-3" /></Button>
                      </div>
                    ) : (
                      <div className="w-48 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors" onClick={() => ogImageInputRef.current?.click()}>
                        <div className="text-center"><Image className="h-6 w-6 mx-auto text-muted-foreground" /><span className="text-xs text-muted-foreground">Clique para enviar</span></div>
                      </div>
                    )}
                    <input ref={ogImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleOgImageUpload} />
                    <div className="flex-1">
                      <Input value={seoSettings.og_image} onChange={(e) => setSeoSettings({ ...seoSettings, og_image: e.target.value, twitter_image: e.target.value })} placeholder="URL da imagem ou faça upload" />
                      <p className="text-xs text-muted-foreground mt-1">Recomendado: 1200x630 pixels, formato PNG ou JPG</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveSeo} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Salvar OG</Button>
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card className="mt-6">
              <CardHeader><CardTitle>Redes Sociais</CardTitle><CardDescription>Configure os links das suas redes sociais (exibidos no rodapé do site)</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Facebook */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between"><Label htmlFor="social_facebook" className="flex items-center gap-2"><Facebook className="h-4 w-4 text-blue-600" />Facebook</Label><Switch checked={socialSettings.facebook_enabled} onCheckedChange={(checked) => setSocialSettings({ ...socialSettings, facebook_enabled: checked })} /></div>
                    <Input id="social_facebook" value={socialSettings.facebook} onChange={(e) => setSocialSettings({ ...socialSettings, facebook: e.target.value })} placeholder="https://facebook.com/..." disabled={!socialSettings.facebook_enabled} className={!socialSettings.facebook_enabled ? 'opacity-50' : ''} />
                  </div>
                  {/* Instagram */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between"><Label htmlFor="social_instagram" className="flex items-center gap-2"><Instagram className="h-4 w-4 text-pink-600" />Instagram</Label><Switch checked={socialSettings.instagram_enabled} onCheckedChange={(checked) => setSocialSettings({ ...socialSettings, instagram_enabled: checked })} /></div>
                    <Input id="social_instagram" value={socialSettings.instagram} onChange={(e) => setSocialSettings({ ...socialSettings, instagram: e.target.value })} placeholder="https://instagram.com/..." disabled={!socialSettings.instagram_enabled} className={!socialSettings.instagram_enabled ? 'opacity-50' : ''} />
                  </div>
                  {/* Twitter */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between"><Label htmlFor="social_twitter" className="flex items-center gap-2"><Twitter className="h-4 w-4 text-sky-500" />Twitter / X</Label><Switch checked={socialSettings.twitter_enabled} onCheckedChange={(checked) => setSocialSettings({ ...socialSettings, twitter_enabled: checked })} /></div>
                    <Input id="social_twitter" value={socialSettings.twitter} onChange={(e) => setSocialSettings({ ...socialSettings, twitter: e.target.value })} placeholder="https://twitter.com/..." disabled={!socialSettings.twitter_enabled} className={!socialSettings.twitter_enabled ? 'opacity-50' : ''} />
                  </div>
                  {/* YouTube */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between"><Label htmlFor="social_youtube" className="flex items-center gap-2"><Youtube className="h-4 w-4 text-red-600" />YouTube</Label><Switch checked={socialSettings.youtube_enabled} onCheckedChange={(checked) => setSocialSettings({ ...socialSettings, youtube_enabled: checked })} /></div>
                    <Input id="social_youtube" value={socialSettings.youtube} onChange={(e) => setSocialSettings({ ...socialSettings, youtube: e.target.value })} placeholder="https://youtube.com/..." disabled={!socialSettings.youtube_enabled} className={!socialSettings.youtube_enabled ? 'opacity-50' : ''} />
                  </div>
                  {/* LinkedIn */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between"><Label htmlFor="social_linkedin" className="flex items-center gap-2"><Linkedin className="h-4 w-4 text-blue-700" />LinkedIn</Label><Switch checked={socialSettings.linkedin_enabled} onCheckedChange={(checked) => setSocialSettings({ ...socialSettings, linkedin_enabled: checked })} /></div>
                    <Input id="social_linkedin" value={socialSettings.linkedin} onChange={(e) => setSocialSettings({ ...socialSettings, linkedin: e.target.value })} placeholder="https://linkedin.com/..." disabled={!socialSettings.linkedin_enabled} className={!socialSettings.linkedin_enabled ? 'opacity-50' : ''} />
                  </div>
                  {/* Pinterest */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between"><Label htmlFor="social_pinterest" className="flex items-center gap-2"><PinterestIcon className="h-4 w-4 text-red-700" />Pinterest</Label><Switch checked={socialSettings.pinterest_enabled} onCheckedChange={(checked) => setSocialSettings({ ...socialSettings, pinterest_enabled: checked })} /></div>
                    <Input id="social_pinterest" value={socialSettings.pinterest} onChange={(e) => setSocialSettings({ ...socialSettings, pinterest: e.target.value })} placeholder="https://pinterest.com/..." disabled={!socialSettings.pinterest_enabled} className={!socialSettings.pinterest_enabled ? 'opacity-50' : ''} />
                  </div>
                  {/* TikTok */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between"><Label htmlFor="social_tiktok" className="flex items-center gap-2"><TikTokIcon className="h-4 w-4" />TikTok</Label><Switch checked={socialSettings.tiktok_enabled} onCheckedChange={(checked) => setSocialSettings({ ...socialSettings, tiktok_enabled: checked })} /></div>
                    <Input id="social_tiktok" value={socialSettings.tiktok} onChange={(e) => setSocialSettings({ ...socialSettings, tiktok: e.target.value })} placeholder="https://tiktok.com/..." disabled={!socialSettings.tiktok_enabled} className={!socialSettings.tiktok_enabled ? 'opacity-50' : ''} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={async () => {
                      setSavingSocial(true);
                      try {
                        const { data: existing } = await supabase.from('site_settings').select('key').eq('key', 'social_links').maybeSingle();
                        let error;
                        if (existing) {
                          const result = await supabase.from('site_settings').update({ value: JSON.parse(JSON.stringify(socialSettings)), updated_at: new Date().toISOString() }).eq('key', 'social_links');
                          error = result.error;
                        } else {
                          const result = await supabase.from('site_settings').insert([{ key: 'social_links', value: JSON.parse(JSON.stringify(socialSettings)) }]);
                          error = result.error;
                        }
                        if (error) throw error;
                        localStorage.setItem('admin_social_settings', JSON.stringify(socialSettings));
                        window.dispatchEvent(new CustomEvent('social-settings-updated', { detail: socialSettings }));
                        toast.success('Redes sociais salvas com sucesso!');
                      } catch (error) { console.error('Error saving social settings:', error); toast.error('Erro ao salvar redes sociais'); }
                      finally { setSavingSocial(false); }
                    }}
                    disabled={savingSocial || loadingSocial}
                  >
                    {savingSocial ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Salvar Redes Sociais
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Settings */}
          <TabsContent value="seo" className="mt-6 space-y-6">
            <Card>
              <CardHeader><CardTitle>Meta Tags</CardTitle><CardDescription>Configure as meta tags para melhorar o SEO do seu site</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label htmlFor="meta_title">Título do Site <span className="text-xs text-muted-foreground ml-2">({seoSettings.meta_title.length}/60 caracteres)</span></Label><Input id="meta_title" value={seoSettings.meta_title} onChange={(e) => setSeoSettings({ ...seoSettings, meta_title: e.target.value })} placeholder="Título para SEO" maxLength={60} /></div>
                <div className="space-y-2"><Label htmlFor="meta_description">Meta Descrição <span className="text-xs text-muted-foreground ml-2">({seoSettings.meta_description.length}/160 caracteres)</span></Label><Textarea id="meta_description" value={seoSettings.meta_description} onChange={(e) => setSeoSettings({ ...seoSettings, meta_description: e.target.value })} placeholder="Descrição para mecanismos de busca" maxLength={160} rows={3} /></div>
                <div className="space-y-2"><Label htmlFor="meta_keywords">Palavras-chave</Label><Input id="meta_keywords" value={seoSettings.meta_keywords} onChange={(e) => setSeoSettings({ ...seoSettings, meta_keywords: e.target.value })} placeholder="jardinagem, plantas, flores (separadas por vírgula)" /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Open Graph (Facebook, LinkedIn)</CardTitle><CardDescription>Configure como seu site aparece quando compartilhado nas redes sociais</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="og_title">Título OG</Label><Input id="og_title" value={seoSettings.og_title} onChange={(e) => setSeoSettings({ ...seoSettings, og_title: e.target.value })} placeholder="Título para compartilhamento" /></div>
                  <div className="space-y-2"><Label htmlFor="og_type">Tipo</Label><Select value={seoSettings.og_type} onValueChange={(value) => setSeoSettings({ ...seoSettings, og_type: value })}><SelectTrigger id="og_type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="website">Website</SelectItem><SelectItem value="article">Artigo</SelectItem><SelectItem value="blog">Blog</SelectItem></SelectContent></Select></div>
                </div>
                <div className="space-y-2"><Label htmlFor="og_description">Descrição OG</Label><Textarea id="og_description" value={seoSettings.og_description} onChange={(e) => setSeoSettings({ ...seoSettings, og_description: e.target.value })} placeholder="Descrição para compartilhamento" rows={2} /></div>
                <div className="space-y-2">
                  <Label>Imagem OG (1200x630 recomendado)</Label>
                  <div className="flex items-start gap-4">
                    {seoSettings.og_image ? (
                      <div className="relative">
                        <img src={seoSettings.og_image} alt="OG Image" className="w-48 h-24 object-cover rounded-lg border" />
                        <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => setSeoSettings({ ...seoSettings, og_image: '', twitter_image: '' })}><X className="h-3 w-3" /></Button>
                      </div>
                    ) : (
                      <div className="w-48 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors" onClick={() => ogImageInputRef.current?.click()}>
                        <div className="text-center"><Image className="h-6 w-6 mx-auto text-muted-foreground" /><span className="text-xs text-muted-foreground">Clique para enviar</span></div>
                      </div>
                    )}
                    <input ref={ogImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleOgImageUpload} />
                    <div className="flex-1">
                      <Input value={seoSettings.og_image} onChange={(e) => setSeoSettings({ ...seoSettings, og_image: e.target.value, twitter_image: e.target.value })} placeholder="URL da imagem ou faça upload" />
                      <p className="text-xs text-muted-foreground mt-1">Recomendado: 1200x630 pixels, formato PNG ou JPG</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Twitter Card</CardTitle><CardDescription>Configure como seu site aparece quando compartilhado no Twitter/X</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="twitter_card">Tipo do Card</Label><Select value={seoSettings.twitter_card} onValueChange={(value) => setSeoSettings({ ...seoSettings, twitter_card: value })}><SelectTrigger id="twitter_card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="summary">Summary</SelectItem><SelectItem value="summary_large_image">Summary Large Image</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label htmlFor="twitter_site">@ do Twitter</Label><Input id="twitter_site" value={seoSettings.twitter_site} onChange={(e) => setSeoSettings({ ...seoSettings, twitter_site: e.target.value })} placeholder="@seusite" /></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Favicon</CardTitle><CardDescription>Configure o ícone que aparece na aba do navegador</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-4">
                    {seoSettings.favicon_url && <div className="relative"><img src={seoSettings.favicon_url} alt="Favicon" className="w-16 h-16 object-contain rounded-lg border p-2 bg-background" /></div>}
                    <Button variant="outline" onClick={() => faviconInputRef.current?.click()} disabled={uploadingFavicon}>{uploadingFavicon ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}Enviar Favicon</Button>
                    <input ref={faviconInputRef} type="file" accept="image/png,image/x-icon,image/svg+xml" className="hidden" onChange={handleFaviconUpload} />
                  </div>
                  <div className="flex-1">
                    <Input value={seoSettings.favicon_url} onChange={(e) => setSeoSettings({ ...seoSettings, favicon_url: e.target.value })} placeholder="URL do favicon" />
                    <p className="text-xs text-muted-foreground mt-1">Recomendado: 32x32 ou 64x64 pixels, formato PNG ou ICO</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Analytics e Verificação</CardTitle><CardDescription>Configure integrações com ferramentas de análise</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="google_analytics_id">Google Analytics ID</Label><Input id="google_analytics_id" value={seoSettings.google_analytics_id} onChange={(e) => setSeoSettings({ ...seoSettings, google_analytics_id: e.target.value })} placeholder="G-XXXXXXXXXX" /></div>
                  <div className="space-y-2"><Label htmlFor="google_search_console">Google Search Console</Label><Input id="google_search_console" value={seoSettings.google_search_console} onChange={(e) => setSeoSettings({ ...seoSettings, google_search_console: e.target.value })} placeholder="Código de verificação" /></div>
                </div>
              </CardContent>
            </Card>

            {/* Facebook Pixel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Facebook className="h-5 w-5 text-blue-600" />Facebook Pixel</CardTitle>
                <CardDescription>Configure o rastreamento de conversões e remarketing do Facebook/Meta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-0.5"><Label className="text-base font-medium">Habilitar Facebook Pixel</Label><p className="text-sm text-muted-foreground">Ativa o script do Facebook Pixel no site</p></div>
                  <Switch checked={seoSettings.facebook_pixel_enabled} onCheckedChange={(checked) => setSeoSettings({ ...seoSettings, facebook_pixel_enabled: checked })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook_pixel_id">Pixel ID</Label>
                  <Input id="facebook_pixel_id" value={seoSettings.facebook_pixel_id} onChange={(e) => setSeoSettings({ ...seoSettings, facebook_pixel_id: e.target.value })} placeholder="123456789012345" className={!seoSettings.facebook_pixel_enabled ? 'opacity-50' : ''} disabled={!seoSettings.facebook_pixel_enabled} />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><ExternalLink className="h-3 w-3" /><span>Encontre seu Pixel ID em: Meta Events Manager → Fontes de dados</span></div>
                  {seoSettings.facebook_pixel_id && (
                    <div className="flex items-center gap-2 text-xs">
                      {seoSettings.facebook_pixel_id.match(/^\d{10,16}$/) ? (<><CheckCircle2 className="h-3 w-3 text-green-600" /><span className="text-green-600">Formato válido</span></>) : (<><AlertTriangle className="h-3 w-3 text-amber-600" /><span className="text-amber-600">O Pixel ID deve conter apenas números (10-16 dígitos)</span></>)}
                    </div>
                  )}
                </div>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="text-sm font-medium">Instruções de Configuração:</h4>
                  <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
                    <li>Acesse o Meta Events Manager (business.facebook.com/events_manager)</li>
                    <li>Selecione ou crie um Pixel</li>
                    <li>Copie o Pixel ID numérico e cole acima</li>
                    <li>Ative o switch e salve as configurações</li>
                  </ol>
                  <p className="text-xs text-green-600 mt-2">✅ O Pixel rastreará automaticamente PageView em todas as páginas. O consentimento de publicidade (TCF) é respeitado.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-600" />Google AdSense</CardTitle>
                <CardDescription>Configure a monetização do seu site com anúncios do Google</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-0.5"><Label className="text-base font-medium">Habilitar Anúncios</Label><p className="text-sm text-muted-foreground">Ativa o script do Google AdSense no site</p></div>
                  <Switch checked={seoSettings.adsense_enabled} onCheckedChange={(checked) => setSeoSettings({ ...seoSettings, adsense_enabled: checked })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adsense_publisher_id">Publisher ID</Label>
                  <Input id="adsense_publisher_id" value={seoSettings.adsense_publisher_id} onChange={(e) => setSeoSettings({ ...seoSettings, adsense_publisher_id: e.target.value })} placeholder="ca-pub-1234567890123456" className={!seoSettings.adsense_enabled ? 'opacity-50' : ''} disabled={!seoSettings.adsense_enabled} />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><ExternalLink className="h-3 w-3" /><span>Encontre seu ID em: AdSense → Conta → Informações da conta</span></div>
                  {seoSettings.adsense_publisher_id && (
                    <div className="flex items-center gap-2 text-xs">
                      {seoSettings.adsense_publisher_id.match(/^ca-pub-\d{16}$/) ? (<><CheckCircle2 className="h-3 w-3 text-green-600" /><span className="text-green-600">Formato válido</span></>) : (<><AlertTriangle className="h-3 w-3 text-amber-600" /><span className="text-amber-600">Formato esperado: ca-pub-XXXXXXXXXXXXXXXX (16 dígitos)</span></>)}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between"><Label htmlFor="ads_txt_content">Conteúdo do ads.txt</Label><span className="text-xs text-muted-foreground">Arquivo: /ads.txt</span></div>
                  <Textarea id="ads_txt_content" value={seoSettings.ads_txt_content} onChange={(e) => setSeoSettings({ ...seoSettings, ads_txt_content: e.target.value })} placeholder="google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0" rows={4} className={`font-mono text-sm ${!seoSettings.adsense_enabled ? 'opacity-50' : ''}`} disabled={!seoSettings.adsense_enabled} />
                  <p className="text-xs text-muted-foreground">Cole o conteúdo fornecido pelo Google AdSense.</p>
                  {seoSettings.adsense_enabled && seoSettings.adsense_publisher_id && !seoSettings.ads_txt_content.includes(seoSettings.adsense_publisher_id) && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded"><AlertTriangle className="h-3 w-3 flex-shrink-0" /><span>O Publisher ID não corresponde ao conteúdo do ads.txt.</span></div>
                  )}
                </div>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="text-sm font-medium">Instruções de Configuração:</h4>
                  <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
                    <li>Acesse sua conta do Google AdSense</li>
                    <li>Vá em Sites → Adicionar site e adicione seu domínio</li>
                    <li>Copie o Publisher ID (ca-pub-XXXXX) e cole acima</li>
                    <li>Em Sites → ads.txt, copie o conteúdo gerado e cole no campo acima</li>
                    <li>Salve as configurações</li>
                  </ol>
                  <p className="text-xs text-green-600 mt-2">✅ O arquivo <code className="bg-muted px-1 rounded">/ads.txt</code> é servido automaticamente com o conteúdo salvo aqui.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Robots.txt</CardTitle><CardDescription>Configure como os mecanismos de busca indexam seu site</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Textarea value={seoSettings.robots_txt} onChange={(e) => setSeoSettings({ ...seoSettings, robots_txt: e.target.value })} placeholder={"User-agent: *\nAllow: /"} rows={5} className="font-mono text-sm" /></div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveSeo} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Salvar Configurações de SEO</Button>
            </div>
          </TabsContent>
        </Tabs>
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
