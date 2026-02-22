import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export type AuditActionType =
  | 'role_promoted' | 'role_revoked' | 'user_edited' | 'password_reset_sent'
  | 'article_published' | 'article_unpublished' | 'article_deleted'
  | 'user_login' | 'user_logout' | 'permission_changed'
  | 'all_permissions_changed' | 'super_admin_promoted' | 'super_admin_revoked';

interface AuditLogEntry {
  action_type: AuditActionType;
  target_user_id?: string;
  details?: Record<string, any>;
}

export function useAuditLog() {
  const { user } = useAuth();
  const [actorInfo, setActorInfo] = useState<{ username: string | null; email: string | null }>({
    username: null, email: null,
  });

  useEffect(() => {
    const fetchActorInfo = async () => {
      if (!user) return;
      const { data: profile } = await (supabase as any)
        .from('profiles').select('username, email').eq('user_id', user.id).maybeSingle();
      if (profile) {
        setActorInfo({ username: profile.username, email: profile.email || user.email || null });
      } else {
        setActorInfo({ username: null, email: user.email || null });
      }
    };
    fetchActorInfo();
  }, [user]);

  const logAction = async (entry: AuditLogEntry) => {
    if (!user) { console.warn('Cannot log audit action: no user logged in'); return; }
    try {
      const enrichedDetails = { ...entry.details, actor_username: actorInfo.username, actor_email: actorInfo.email };
      const { error } = await (supabase as any).from('audit_logs').insert({
        user_id: user.id, action_type: entry.action_type,
        target_user_id: entry.target_user_id || null, details: enrichedDetails,
      });
      if (error) console.error('Error logging audit action:', error);
    } catch (err) { console.error('Failed to log audit action:', err); }
  };

  return { logAction };
}
