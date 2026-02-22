import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    const category = url.searchParams.get('category');

    if (!slug) {
      return new Response('Missing slug', { status: 400 });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: article } = await supabase
      .from('content_articles')
      .select('title, excerpt, cover_image, category_slug, slug')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    const siteUrl = 'https://homegardenmanual.com';
    const fallbackImage = `${siteUrl}/og-image.jpg`;

    const title = article?.title || 'Home & Garden Manual';
    const description = article?.excerpt || 'Dicas, tutoriais e guias completas para criar seu jardim perfeito.';
    const image = article?.cover_image || fallbackImage;
    const articleCategory = article?.category_slug || category || '';
    const articleSlug = article?.slug || slug;
    const articleUrl = `${siteUrl}/${articleCategory}/${articleSlug}`;

    // Return HTML with OG tags that redirect to the actual article
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)} | Home Garden Manual</title>
  <meta name="description" content="${escapeHtml(description)}" />
  
  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${escapeHtml(articleUrl)}" />
  <meta property="og:site_name" content="Home & Garden Manual" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  
  <!-- Redirect real users to the actual article -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(articleUrl)}" />
  <link rel="canonical" href="${escapeHtml(articleUrl)}" />
</head>
<body>
  <p>Redirecionando para <a href="${escapeHtml(articleUrl)}">${escapeHtml(title)}</a>...</p>
</body>
</html>`;

    const headers = new Headers();
    headers.set('Content-Type', 'text/html; charset=utf-8');
    headers.set('Cache-Control', 'public, max-age=3600');
    headers.set('Content-Security-Policy', "default-src 'none'");
    
    return new Response(html, { headers });

  } catch (error) {
    console.error('OG redirect error:', error);
    return new Response('Error', { status: 500 });
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
