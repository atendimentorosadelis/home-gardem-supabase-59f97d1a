import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string; user_id: string; title: string; message: string;
  type: 'info' | 'success' | 'warning' | 'article';
  link: string | null; is_read: boolean; created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any).from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await (supabase as any).from('notifications').update({ is_read: true }).eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await (supabase as any).from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await (supabase as any).from('notifications').delete().eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('notifications-changes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => refetch()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refetch]);

  return { notifications, unreadCount, isLoading, markAsRead: markAsReadMutation.mutate, markAllAsRead: markAllAsReadMutation.mutate, deleteNotification: deleteNotificationMutation.mutate, refetch };
}

export async function createNotificationForAdmins(
  title: string,
  message: string,
  type: string = 'info',
  link: string | null = null
) {
  try {
    const { data: admins, error: adminsError } = await (supabase as any)
      .from('admin_users')
      .select('id');

    if (adminsError || !admins) return;

    const notifications = admins.map((admin: any) => ({
      user_id: admin.id,
      title,
      message,
      type,
      link,
      is_read: false,
    }));

    await (supabase as any).from('notifications').insert(notifications);
  } catch (error) {
    console.error('Error creating notifications:', error);
  }
}
