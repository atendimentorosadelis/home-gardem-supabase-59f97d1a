import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = 'https://xfhtixubllcdockbkbwm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmaHRpeHVibGxjZG9ja2JrYndtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MjY4ODAsImV4cCI6MjA4NzMwMjg4MH0.JRQHxGOZ-7L0C2D1m_vRmKHDfvdJaEhF3OuU32QSQFI';

console.log('[Supabase] Using Supabase (xfhtixubllcdockbkbwm)');

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

export const SUPABASE_PROJECT_URL = SUPABASE_URL;
