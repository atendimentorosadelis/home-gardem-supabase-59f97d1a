import { supabase } from '@/lib/supabase';

const SUPABASE_FUNCTIONS_URL = 'https://lhtetfcujdzulfyekiub.supabase.co/functions/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxodGV0ZmN1amR6dWxmeWVraXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NTMzNTYsImV4cCI6MjA4NDQyOTM1Nn0.NOHNkC65PjsBql23RNa5KU3NauN6C3BmPrM02lETBoc';

export interface EdgeFunctionResponse<T = any> {
  data: T | null;
  error: Error | null;
}

export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body?: any,
  requiresAuth: boolean = false
): Promise<EdgeFunctionResponse<T>> {
  try {
    let authToken = SUPABASE_ANON_KEY;

    if (requiresAuth) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.access_token) {
        authToken = sessionData.session.access_token;
      }
    }

    const url = `${SUPABASE_FUNCTIONS_URL}/${functionName}`;
    console.log(`[EdgeFunction] Calling: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Edge function error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error(`[EdgeFunction] Error invoking ${functionName}:`, error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}

export const EDGE_FUNCTIONS = {
  GENERATE_FULL_ARTICLE: 'generate-full-article',
  GENERATE_ARTICLE_IMAGE: 'generate-article-image',
  TRANSLATE_CONTENT: 'translate-content',
  SEND_NEWSLETTER: 'send-newsletter',
  SEND_CONTACT_EMAIL: 'send-contact-email',
  AUTO_GENERATE_ARTICLE: 'auto-generate-article',
  EXPAND_EXCERPTS: 'expand-excerpts',
  INVITE_ADMIN: 'invite-admin',
  ADMIN_USER_MANAGEMENT: 'admin-user-management',
  GENERATE_AI_REPLY: 'generate-ai-reply',
  REPLY_CONTACT_MESSAGE: 'reply-contact-message',
  MIGRATE_IMAGES_TO_WEBP: 'migrate-images-to-webp',
  BACKUP_IMAGES: 'backup-images',
  RESTORE_IMAGES: 'restore-images',
  PROCESS_IMAGE_QUEUE: 'process-image-queue',
  NOTIFY_ARTICLE_READY: 'notify-article-ready',
  GET_EMAIL_TEMPLATES: 'get-email-templates',
  UPDATE_EMAIL_TEMPLATE: 'update-email-template',
  MANAGE_CONTACT_MESSAGES: 'manage-contact-messages',
  SEARCH_YOUTUBE_VIDEO: 'search-youtube-video',
  PROCESS_VIDEO_QUEUE: 'process-video-queue',
  SERVE_ADS_TXT: 'serve-ads-txt',
  GENERATE_EMOTIONAL_CONCLUSION: 'generate-emotional-conclusion',
  ORCHESTRATE_ARTICLE_GENERATION: 'orchestrate-article-generation',
} as const;
