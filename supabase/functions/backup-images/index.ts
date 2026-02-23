import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const startTime = Date.now();

    // Fetch all articles with images
    const { data: articles, error: articlesError } = await supabase
      .from('content_articles')
      .select('id, title, cover_image, gallery_images');

    if (articlesError) throw articlesError;

    const today = new Date().toISOString().split('T')[0];
    let totalImages = 0;
    let backedUp = 0;
    let failed = 0;

    for (const article of (articles || [])) {
      const imagesToBackup: { url: string; path: string }[] = [];

      if (article.cover_image) {
        totalImages++;
        const ext = article.cover_image.includes('.webp') ? 'webp' : 'jpg';
        imagesToBackup.push({
          url: article.cover_image,
          path: `backups/${today}/${article.id}/cover.${ext}`,
        });
      }

      const gallery = article.gallery_images as string[] | null;
      if (gallery && Array.isArray(gallery)) {
        gallery.forEach((imgUrl: string, index: number) => {
          if (imgUrl && typeof imgUrl === 'string') {
            totalImages++;
            const ext = imgUrl.includes('.webp') ? 'webp' : 'jpg';
            imagesToBackup.push({
              url: imgUrl,
              path: `backups/${today}/${article.id}/gallery-${index}.${ext}`,
            });
          }
        });
      }

      for (const img of imagesToBackup) {
        try {
          const response = await fetch(img.url);
          if (!response.ok) {
            failed++;
            continue;
          }
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          const { error: uploadError } = await supabase.storage
            .from('article-images')
            .upload(img.path, uint8Array, {
              contentType: blob.type || 'image/webp',
              upsert: true,
            });

          if (uploadError) {
            console.error(`Upload error for ${img.path}:`, uploadError);
            failed++;
          } else {
            backedUp++;
          }
        } catch (err) {
          console.error(`Fetch error for ${img.url}:`, err);
          failed++;
        }
      }
    }

    const durationMs = Date.now() - startTime;

    // Log the backup
    await supabase.from('image_backup_logs').insert({
      total_images: totalImages,
      backed_up: backedUp,
      failed,
      status: failed === 0 ? 'success' : (backedUp > 0 ? 'partial' : 'failed'),
      duration_ms: durationMs,
    });

    return new Response(
      JSON.stringify({
        success: true,
        stats: { totalImages, backedUp, failed, durationMs },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Backup error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
