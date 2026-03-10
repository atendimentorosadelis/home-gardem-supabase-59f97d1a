import { supabase } from '@/lib/supabase';

const SUPABASE_FUNCTIONS_URL = 'https://xfhtixubllcdockbkbwm.supabase.co/functions/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmaHRpeHVibGxjZG9ja2JrYndtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MjY4ODAsImV4cCI6MjA4NzMwMjg4MH0.JRQHxGOZ-7L0C2D1m_vRmKHDfvdJaEhF3OuU32QSQFI';

export interface EdgeFunctionResponse<T = any> {
  data: T | null;
  error: Error | null;
}

export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body?: any,
  requiresAuth: boolean = false,
  options?: { timeoutMs?: number; retries?: number }
): Promise<EdgeFunctionResponse<T>> {
  const maxRetries = options?.retries ?? 0;
  const timeoutMs = options?.timeoutMs ?? 180000; // 3 min default

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      let authToken = SUPABASE_ANON_KEY;

      if (requiresAuth) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.access_token) {
          authToken = sessionData.session.access_token;
        }
      }

      const url = `${SUPABASE_FUNCTIONS_URL}/${functionName}`;
      console.log(`[EdgeFunction] Calling: ${url} (attempt ${attempt + 1}/${maxRetries + 1})`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Edge function error: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch {
          if (errorText) errorMessage = errorText;
        }
        // Retry on 5xx errors
        if (response.status >= 500 && attempt < maxRetries) {
          console.warn(`[EdgeFunction] ${functionName} returned ${response.status}, retrying in 3s...`);
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      const isAbort = error instanceof DOMException && error.name === 'AbortError';
      const errorMsg = isAbort
        ? `Timeout após ${Math.round(timeoutMs / 1000)}s`
        : (error instanceof Error ? error.message : 'Unknown error');

      // Retry on network errors / timeouts
      if (attempt < maxRetries) {
        console.warn(`[EdgeFunction] ${functionName} failed (${errorMsg}), retrying in 3s...`);
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      console.error(`[EdgeFunction] Error invoking ${functionName}:`, errorMsg);
      return {
        data: null,
        error: new Error(errorMsg)
      };
    }
  }

  return { data: null, error: new Error('Max retries exceeded') };
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
  GENERATE_TITLE_SUGGESTIONS: 'generate-title-suggestions',
  PING_SITEMAP: 'ping-sitemap',
} as const;
