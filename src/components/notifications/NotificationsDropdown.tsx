import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, ExternalLink, FileText, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNotifications, Notification } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const typeIcons = { info: Info, success: Check, warning: AlertTriangle, article: FileText };
const typeColors = { info: 'text-blue-500', success: 'text-green-500', warning: 'text-amber-500', article: 'text-primary' };

export function NotificationsDropdown() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) markAsRead(notification.id);
    if (notification.link) { setOpen(false); navigate(notification.link); }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs" onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}>
              <CheckCheck className="h-3 w-3 mr-1" />Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm"><Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />Nenhuma notificação</div>
        ) : (
          <ScrollArea className="h-[300px]">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type] || Info;
              return (
                <DropdownMenuItem key={notification.id} className={cn('flex items-start gap-3 p-3 cursor-pointer', !notification.is_read && 'bg-primary/5')} onClick={() => handleNotificationClick(notification)}>
                  <div className={cn('mt-0.5 shrink-0', typeColors[notification.type])}><Icon className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className={cn('text-sm truncate', !notification.is_read && 'font-medium')}>{notification.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}</span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
