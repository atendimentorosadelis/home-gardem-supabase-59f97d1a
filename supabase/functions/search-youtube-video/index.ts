import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function searchYouTube(query: string): Promise<{ videoId: string; title: string; url: string } | null> {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      console.error('YouTube search failed:', response.status);
      return null;
    }

    const html = await response.text();
    
    // Extract ytInitialData JSON from the HTML
    const dataMatch = html.match(/var ytInitialData = ({.*?});<\/script>/s);
    if (!dataMatch) {
      console.error('Could not find ytInitialData in YouTube response');
      // Fallback: try to extract video IDs directly from HTML
      const videoIdMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
      if (videoIdMatch) {
        const videoId = videoIdMatch[1];
        // Get title via oEmbed (no API key needed)
        const title = await getVideoTitle(videoId);
        return {
          videoId,
          title: title || query,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        };
      }
      return null;
    }

    const data = JSON.parse(dataMatch[1]);
    
    // Navigate the nested structure to find video results
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (!contents) return null;

    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents;
      if (!items) continue;

      for (const item of items) {
        const videoRenderer = item?.videoRenderer;
        if (videoRenderer?.videoId) {
          return {
            videoId: videoRenderer.videoId,
            title: videoRenderer.title?.runs?.[0]?.text || query,
            url: `https://www.youtube.com/watch?v=${videoRenderer.videoId}`,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return null;
  }
}

async function getVideoTitle(videoId: string): Promise<string | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = await response.json();
      return data.title || null;
    }
    return null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleId, saveToDb } = await req.json();

    if (!articleId) {
      return new Response(JSON.stringify({ error: 'articleId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get article title for search query
    const { data: article, error: articleError } = await supabase
      .from('content_articles')
      .select('title, category, main_subject, keywords')
      .eq('id', articleId)
      .single();

    if (articleError || !article) {
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build search query from article info
    const searchTerms = [article.title];
    if (article.main_subject) searchTerms.push(article.main_subject);
    const searchQuery = searchTerms.join(' ').substring(0, 100);

    console.log(`Searching YouTube for: "${searchQuery}"`);

    const result = await searchYouTube(searchQuery);

    if (!result) {
      return new Response(JSON.stringify({ success: false, error: 'No video found for this topic' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found video: ${result.title} (${result.videoId})`);

    if (saveToDb) {
      // Upsert into article_videos
      const { error: upsertError } = await supabase
        .from('article_videos')
        .upsert({
          article_id: articleId,
          youtube_video_id: result.videoId,
          youtube_url: result.url,
          video_title: result.title,
          is_enabled: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'article_id' });

      if (upsertError) {
        console.error('Error saving video:', upsertError);
        return new Response(JSON.stringify({ success: false, error: 'Failed to save video' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      videoId: result.videoId,
      videoTitle: result.title,
      youtubeUrl: result.url,
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
