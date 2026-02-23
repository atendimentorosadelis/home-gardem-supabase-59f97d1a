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
    
    // Converter imagem para JPEG via wsrv.nl (proxy de imagem gratuito)
    let ogImage = fallbackImage;
    if (article?.cover_image) {
      ogImage = `https://wsrv.nl/?url=${encodeURIComponent(article.cover_image)}&w=1200&h=630&fit=cover&output=jpg&q=85`;
    }
    
    const articleCategory = article?.category_slug || category || '';
    const articleSlug = article?.slug || slug;
    const articleUrl = `${siteUrl}/${articleCategory}/${articleSlug}`;

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
  <meta property="og:image" content="${escapeAttr(ogImage)}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(title)}" />
  <meta property="og:url" content="${escapeAttr(articleUrl)}" />
  <meta property="og:site_name" content="Home &amp; Garden Manual" />
  <meta property="og:locale" content="pt_BR" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeAttr(ogImage)}" />
  
  <!-- Redirect real users to the actual article -->
  <meta http-equiv="refresh" content="0;url=${escapeAttr(articleUrl)}" />
  <link rel="canonical" href="${escapeAttr(articleUrl)}" />
</head>
<body>
  <p>Redirecionando para <a href="${escapeAttr(articleUrl)}">${escapeHtml(title)}</a>...</p>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('OG redirect error:', error);
    return new Response('Error', { status: 500 });
  }
});

// Escape para conteúdo de texto HTML
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Escape para atributos HTML - escapa &, ", < e > para conformidade com HTML
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
