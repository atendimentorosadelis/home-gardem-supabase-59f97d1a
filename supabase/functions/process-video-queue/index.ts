import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

async function searchAndSaveVideo(supabase: any, articleId: string, articleTitle: string): Promise<{ success: boolean; title?: string }> {
  try {
    // Call the search-youtube-video function internally
    const response = await fetch(`${SUPABASE_URL}/functions/v1/search-youtube-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ articleId, saveToDb: true }),
    });

    const data = await response.json();
    return { success: data.success === true, title: data.videoTitle };
  } catch (error) {
    console.error(`Error processing article ${articleId}:`, error);
    return { success: false };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batchSize = 5, force = false } = await req.json();

    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, supabaseKey);

    // Get published articles without videos
    const { data: existingVideos } = await supabase
      .from('article_videos')
      .select('article_id');

    const existingArticleIds = (existingVideos || []).map((v: any) => v.article_id);

    let query = supabase
      .from('content_articles')
      .select('id, title')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(batchSize);

    if (existingArticleIds.length > 0 && !force) {
      query = query.not('id', 'in', `(${existingArticleIds.join(',')})`);
    }

    const { data: articles, error } = await query;

    if (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ success: true, processed: 0, successful: 0, message: 'No articles to process' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let successful = 0;
    for (const article of articles) {
      const result = await searchAndSaveVideo(supabase, article.id, article.title);
      if (result.success) successful++;
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    return new Response(JSON.stringify({
      success: true,
      processed: articles.length,
      successful,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
