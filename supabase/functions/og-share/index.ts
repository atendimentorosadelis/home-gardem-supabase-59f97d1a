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
    const imageProxy = url.searchParams.get('image'); // ?image=1 → serve image as proxy

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

    // Se pediu proxy de imagem, buscar e servir a imagem diretamente
    if (imageProxy === '1' && article?.cover_image) {
      try {
        const imgResponse = await fetch(article.cover_image);
        if (!imgResponse.ok) {
          return new Response('Image not found', { status: 404 });
        }
        const imgBytes = await imgResponse.arrayBuffer();
        // Servir como JPEG content-type mesmo sendo WebP bytes
        // Crawlers (WhatsApp/Facebook) aceitam os bytes reais independente do content-type
        const contentType = article.cover_image.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
        return new Response(imgBytes, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (e) {
        console.error('Image proxy error:', e);
        return new Response('Image proxy error', { status: 500 });
      }
    }

    const siteUrl = 'https://homegardenmanual.com';
    const fallbackImage = `${siteUrl}/og-image.jpg`;

    const title = article?.title || 'Home & Garden Manual';
    const description = article?.excerpt || 'Dicas, tutoriais e guias completas para criar seu jardim perfeito.';
    
    // Para og:image, usar a URL da própria edge function como proxy
    // Isso garante que o crawler consiga acessar a imagem sem problemas de CORS/proxy
    const edgeFunctionBaseUrl = `${SUPABASE_URL}/functions/v1/og-share`;
    let ogImage = fallbackImage;
    const ogImageType = 'image/jpeg';
    if (article?.cover_image) {
      ogImage = `${edgeFunctionBaseUrl}?slug=${encodeURIComponent(slug)}&image=1`;
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
  <meta property="og:image:type" content="${ogImageType}" />
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

// Escape para atributos HTML
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
