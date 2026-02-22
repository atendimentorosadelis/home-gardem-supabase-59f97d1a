import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const currentSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await currentSupabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Connect to OLD Supabase
    const rawUrl = Deno.env.get('OLD_SUPABASE_URL');
    const rawKey = Deno.env.get('OLD_SUPABASE_ANON_KEY');
    
    console.log('=== DEBUG SECRETS ===');
    console.log('rawUrl type:', typeof rawUrl);
    console.log('rawUrl is null:', rawUrl === null);
    console.log('rawUrl is undefined:', rawUrl === undefined);
    console.log('rawUrl length:', rawUrl?.length);
    console.log('rawUrl first 30 chars:', JSON.stringify(rawUrl?.substring(0, 30)));
    console.log('rawUrl last 10 chars:', JSON.stringify(rawUrl?.substring((rawUrl?.length || 0) - 10)));
    console.log('rawKey present:', !!rawKey);
    console.log('rawKey length:', rawKey?.length);
    
    const oldUrl = rawUrl?.trim();
    const oldKey = rawKey?.trim();
    
    console.log('trimmed oldUrl length:', oldUrl?.length);
    console.log('trimmed oldUrl first 30 chars:', JSON.stringify(oldUrl?.substring(0, 30)));
    
    if (!oldUrl || !oldKey) {
      throw new Error(`Secrets not configured. URL present: ${!!oldUrl}, Key present: ${!!oldKey}`);
    }
    
    if (!oldUrl.startsWith('http://') && !oldUrl.startsWith('https://')) {
      throw new Error(`OLD_SUPABASE_URL must start with https:// - got first 30: "${oldUrl.substring(0, 30)}"`);
    }

    console.log('About to create oldSupabase client with URL:', oldUrl);
    const oldSupabase = createClient(oldUrl, oldKey);

    // Fetch all articles from old DB
    const { data: oldArticles, error: fetchError } = await oldSupabase
      .from('content_articles')
      .select('*')
      .order('created_at', { ascending: true });

    if (fetchError) throw new Error(`Failed to fetch from old DB: ${fetchError.message}`);
    if (!oldArticles || oldArticles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No articles found in old database', migrated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${oldArticles.length} articles in old database`);

    // Use service role to insert into current DB
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check existing slugs to avoid duplicates
    const { data: existingArticles } = await serviceSupabase
      .from('content_articles')
      .select('slug');
    
    const existingSlugs = new Set((existingArticles || []).map(a => a.slug));

    let migrated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const article of oldArticles) {
      // Skip if slug already exists
      if (article.slug && existingSlugs.has(article.slug)) {
        skipped++;
        console.log(`Skipped (duplicate): ${article.title}`);
        continue;
      }

      // Remove id to let new DB generate it, keep everything else
      const { id, ...articleData } = article;

      const { error: insertError } = await serviceSupabase
        .from('content_articles')
        .insert(articleData);

      if (insertError) {
        errors.push(`"${article.title}": ${insertError.message}`);
        console.error(`Failed to insert "${article.title}":`, insertError.message);
      } else {
        migrated++;
        console.log(`Migrated: ${article.title}`);
      }
    }

    // Also try to migrate related data
    let conclusionsMigrated = 0;
    let videosMigrated = 0;

    // Migrate emotional conclusions
    const { data: oldConclusions } = await oldSupabase
      .from('article_emotional_conclusions')
      .select('*');

    if (oldConclusions && oldConclusions.length > 0) {
      // Get mapping of old slug -> new id
      const { data: newArticles } = await serviceSupabase
        .from('content_articles')
        .select('id, slug');
      
      const { data: oldArticlesWithId } = await oldSupabase
        .from('content_articles')
        .select('id, slug');

      if (newArticles && oldArticlesWithId) {
        const oldIdToSlug = new Map(oldArticlesWithId.map(a => [a.id, a.slug]));
        const slugToNewId = new Map(newArticles.map(a => [a.slug, a.id]));

        for (const conclusion of oldConclusions) {
          const slug = oldIdToSlug.get(conclusion.article_id);
          const newId = slug ? slugToNewId.get(slug) : null;
          if (newId) {
            const { id, article_id, ...rest } = conclusion;
            const { error } = await serviceSupabase
              .from('article_emotional_conclusions')
              .upsert({ ...rest, article_id: newId }, { onConflict: 'article_id' });
            if (!error) conclusionsMigrated++;
          }
        }
      }
    }

    // Migrate article videos
    const { data: oldVideos } = await oldSupabase
      .from('article_videos')
      .select('*');

    if (oldVideos && oldVideos.length > 0) {
      const { data: newArticles } = await serviceSupabase
        .from('content_articles')
        .select('id, slug');
      const { data: oldArticlesWithId } = await oldSupabase
        .from('content_articles')
        .select('id, slug');

      if (newArticles && oldArticlesWithId) {
        const oldIdToSlug = new Map(oldArticlesWithId.map(a => [a.id, a.slug]));
        const slugToNewId = new Map(newArticles.map(a => [a.slug, a.id]));

        for (const video of oldVideos) {
          const slug = oldIdToSlug.get(video.article_id);
          const newId = slug ? slugToNewId.get(slug) : null;
          if (newId) {
            const { id, article_id, ...rest } = video;
            const { error } = await serviceSupabase
              .from('article_videos')
              .upsert({ ...rest, article_id: newId }, { onConflict: 'article_id' });
            if (!error) videosMigrated++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: oldArticles.length,
        migrated,
        skipped,
        conclusionsMigrated,
        videosMigrated,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
