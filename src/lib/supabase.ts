import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = 'https://lhtetfcujdzulfyekiub.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxodGV0ZmN1amR6dWxmeWVraXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NTMzNTYsImV4cCI6MjA4NDQyOTM1Nn0.NOHNkC65PjsBql23RNa5KU3NauN6C3BmPrM02lETBoc';

console.log('[Supabase] Using External Supabase (lhtetfcujdzulfyekiub)');

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

export const SUPABASE_PROJECT_URL = SUPABASE_URL;
