import { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, LogOut, FolderOpen, Users, Settings, ImageIcon, Images, Mail, MessageSquare, Palette, ExternalLink, Bot, X, Shield, Youtube } from 'lucide-react';
import logoDark from '@/assets/logo-home-garden.png';
import logoLight from '@/assets/logo-home-garden-light.png';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigationBlock } from '@/contexts/NavigationBlockContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/lib/supabase';
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const menuGroups = [
  { id: 'dashboard', style: 'highlight' as const, items: [{ title: 'Dashboard', url: '/admin', icon: LayoutDashboard }] },
  { id: 'content', label: 'Conteúdo', style: 'card' as const, items: [
    { title: 'Artigos', url: '/admin/articles', icon: FolderOpen },
    { title: 'Gerar Conteúdo', url: '/admin/generate', icon: FileText },
    { title: 'Vídeos', url: '/admin/videos', icon: Youtube },
    { title: 'Afiliados', url: '/admin/affiliates', icon: ExternalLink },
  ]},
  { id: 'automation', label: 'Automação', style: 'card' as const, items: [
    { title: 'Piloto Automático', url: '/admin/autopilot', icon: Bot },
    { title: 'Vídeos Auto', url: '/admin/video-autopilot', icon: Youtube },
  ]},
  { id: 'images', label: 'Imagens', style: 'card' as const, items: [
    { title: 'Fila de Imagens', url: '/admin/queue', icon: ImageIcon },
    { title: 'Biblioteca de Imagens', url: '/admin/images', icon: Images },
  ]},
  { id: 'communication', label: 'Comunicação', style: 'card' as const, items: [
    { title: 'Mensagens', url: '/admin/messages', icon: MessageSquare },
    { title: 'Newsletter', url: '/admin/newsletter', icon: Mail },
    { title: 'Templates de E-mail', url: '/admin/email-templates', icon: Palette },
  ]},
  { id: 'system', style: 'highlight' as const, items: [
    { title: 'Usuários', url: '/admin/users', icon: Users },
    { title: 'Configurações', url: '/admin/settings', icon: Settings },
  ]},
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { requestNavigation } = useNavigationBlock();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!user) { setIsSuperAdmin(false); return; }
      const [permissionsResult, profileResult] = await Promise.all([
        (supabase as any).from('admin_permissions').select('is_super_admin').eq('user_id', user.id).maybeSingle(),
        (supabase as any).from('profiles').select('username').eq('user_id', user.id).single()
      ]);
      const isSuperByPermission = permissionsResult.data?.is_super_admin === true;
      const isSuperByUsername = profileResult.data?.username?.toLowerCase().includes('walliston') || false;
      setIsSuperAdmin(isSuperByPermission || isSuperByUsername);
    };
    checkSuperAdmin();
  }, [user]);

  const isActive = (url: string) => url === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(url);

  const handleNavigation = (url: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (requestNavigation) { const canNavigate = requestNavigation(url); if (!canNavigate) return; }
    navigate(url);
  };

  return (
    <Sidebar collapsible="icon" className={cn("border-r", isDark ? "bg-[#099268] border-white/20" : "bg-[#E8F5E9] border-[#099268]/20")}>
      <SidebarHeader className={cn("border-b", isMobile ? "p-3" : "p-4", isDark ? "border-white/20" : "border-[#099268]/20")}>
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col items-center gap-1 flex-1">
            <Link to="/" target="_blank" className="transition-transform hover:scale-105" title="Abrir site">
              <img src={isDark ? logoLight : logoDark} alt="Home Garden" className={cn(collapsed ? "h-10" : "h-16", "w-auto")} />
            </Link>
            {!collapsed && <span className={cn("uppercase tracking-wider", isMobile ? "text-[9px]" : "text-[10px]", isDark ? "text-white/70" : "text-[#1B4332]/70")}>Área Admin</span>}
          </div>
          {isMobile && !collapsed && (
            <Button variant="ghost" size="icon" className={cn("h-8 w-8 shrink-0", isDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-[#1B4332]/70 hover:text-[#1B4332] hover:bg-[#099268]/10")}
              onClick={() => { const trigger = document.querySelector('[data-sidebar="trigger"]') as HTMLButtonElement; trigger?.click(); }}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-3 px-2 space-y-2">
        {menuGroups.map((group) => (
          <div key={group.id} className={cn(group.style === 'card' && 'rounded-lg p-2', group.style === 'card' && (isDark ? 'bg-white/10' : 'bg-[#099268]/10'), group.style === 'highlight' && 'space-y-1')}>
            {group.label && !collapsed && <span className={cn("uppercase tracking-wider px-2 py-1 block font-medium", isMobile ? "text-[9px]" : "text-[10px]", isDark ? "text-white/70" : "text-[#1B4332]/70")}>{group.label}</span>}
            <SidebarMenu>
              {group.items.map((item) => {
                const active = isActive(item.url);
                const isHighlight = group.style === 'highlight';
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}
                      className={cn('transition-all duration-200', isDark ? 'text-white hover:text-white' : 'text-[#1B4332] hover:text-[#1B4332]',
                        isHighlight && !active && (isDark ? 'bg-black/40 hover:bg-black/60' : 'bg-[#099268]/20 hover:bg-[#099268]/30'),
                        !isHighlight && !active && (isDark ? 'hover:bg-white/20' : 'hover:bg-[#099268]/20'),
                        active && (isDark ? 'bg-white text-[#099268] hover:bg-white/90 hover:text-[#099268]' : 'bg-[#099268] text-white hover:bg-[#099268]/90 hover:text-white'))}>
                      <a href={item.url} onClick={handleNavigation(item.url)} className="text-inherit">
                        <item.icon className="h-4 w-4" /><span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>
        ))}
        {isSuperAdmin && (
          <div className="mt-2"><SidebarMenu><SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive('/admin/super-admin')} tooltip="Super Admin"
              className={cn('transition-all duration-200', 'bg-red-600 text-white hover:bg-red-700 hover:text-white', isActive('/admin/super-admin') && 'ring-2 ring-red-400 ring-offset-1')}>
              <a href="/admin/super-admin" onClick={handleNavigation('/admin/super-admin')} className="text-inherit">
                <Shield className="h-4 w-4" /><span>Super Admin</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem></SidebarMenu></div>
        )}
      </SidebarContent>

      <SidebarFooter className={cn("border-t", isMobile ? "p-3" : "p-4", isDark ? "border-white/20" : "border-[#099268]/20")}>
        <Button variant="ghost" className={cn('w-full justify-start', isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-[#1B4332]/70 hover:text-[#1B4332] hover:bg-[#099268]/10', collapsed && 'justify-center px-0')}
          onClick={() => signOut()}>
          <LogOut className="h-4 w-4" />{!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
