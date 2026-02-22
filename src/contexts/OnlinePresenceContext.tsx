import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

interface OnlinePresenceContextType {
  onlineUsers: Set<string>;
  isUserOnline: (userId: string) => boolean;
  onlineCount: number;
}

const OnlinePresenceContext = createContext<OnlinePresenceContextType | undefined>(undefined);

export function OnlinePresenceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  useEffect(() => {
    if (!user) {
      setOnlineUsers(new Set());
      return;
    }

    const presenceChannel = supabase.channel('online-users', {
      config: { presence: { key: user.id } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const userIds = new Set<string>();
        Object.entries(state).forEach(([key, presences]) => {
          if (key) userIds.add(key);
          if (Array.isArray(presences)) {
            presences.forEach((presence: any) => {
              if (presence.user_id) userIds.add(presence.user_id);
            });
          }
        });
        setOnlineUsers(userIds);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          if (key) updated.add(key);
          if (Array.isArray(newPresences)) {
            newPresences.forEach((p: any) => { if (p.user_id) updated.add(p.user_id); });
          }
          return updated;
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setOnlineUsers(prev => {
          const updated = new Set(prev);
          if (key) updated.delete(key);
          if (Array.isArray(leftPresences)) {
            leftPresences.forEach((p: any) => { if (p.user_id) updated.delete(p.user_id); });
          }
          return updated;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    const interval = setInterval(async () => {
      await presenceChannel.track({ user_id: user.id, online_at: new Date().toISOString() });
    }, 30000);

    return () => {
      clearInterval(interval);
      presenceChannel.unsubscribe();
    };
  }, [user]);

  return (
    <OnlinePresenceContext.Provider value={{ onlineUsers, isUserOnline, onlineCount: onlineUsers.size }}>
      {children}
    </OnlinePresenceContext.Provider>
  );
}

export function useOnlinePresence() {
  const context = useContext(OnlinePresenceContext);
  if (context === undefined) {
    throw new Error('useOnlinePresence must be used within an OnlinePresenceProvider');
  }
  return context;
}
