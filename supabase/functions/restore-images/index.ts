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

    const body = await req.json();
    const { action } = body;

    // List available backup dates
    if (action === 'list-dates') {
      const { data: files, error } = await supabase.storage
        .from('article-images')
        .list('backups', { limit: 100, sortBy: { column: 'name', order: 'desc' } });

      if (error) throw error;

      const dates = (files || [])
        .filter((f: any) => f.id && f.name && !f.name.startsWith('.'))
        .map((f: any) => f.name);

      return new Response(
        JSON.stringify({ dates }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // List articles for a specific backup date
    if (action === 'list-articles') {
      const { date } = body;
      if (!date) throw new Error('Date is required');

      const { data: folders, error } = await supabase.storage
        .from('article-images')
        .list(`backups/${date}`, { limit: 1000 });

      if (error) throw error;

      const articles: any[] = [];

      for (const folder of (folders || [])) {
        if (!folder.name || folder.name.startsWith('.')) continue;

        const articleId = folder.name;

        // Get article title
        const { data: articleData } = await supabase
          .from('content_articles')
          .select('title')
          .eq('id', articleId)
          .maybeSingle();

        // List images in this folder
        const { data: imageFiles } = await supabase.storage
          .from('article-images')
          .list(`backups/${date}/${articleId}`, { limit: 100 });

        const images = (imageFiles || []).map((f: any) => {
          const isCover = f.name.startsWith('cover');
          const indexMatch = f.name.match(/gallery-(\d+)/);
          return {
            name: f.name,
            path: `backups/${date}/${articleId}/${f.name}`,
            type: isCover ? 'cover' : 'gallery',
            index: indexMatch ? parseInt(indexMatch[1]) : 0,
          };
        });

        articles.push({
          id: articleId,
          title: articleData?.title || 'Artigo removido',
          backupDate: date,
          images,
        });
      }

      return new Response(
        JSON.stringify({ articles }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Restore images
    if (action === 'restore') {
      const { date, articleId, imageType, imageIndex } = body;
      if (!date || !articleId) throw new Error('Date and articleId are required');

      const restored = { cover: 0, gallery: 0 };

      // List backup files for article
      const { data: backupFiles, error } = await supabase.storage
        .from('article-images')
        .list(`backups/${date}/${articleId}`, { limit: 100 });

      if (error) throw error;

      for (const file of (backupFiles || [])) {
        const isCover = file.name.startsWith('cover');
        const indexMatch = file.name.match(/gallery-(\d+)/);
        const fileIndex = indexMatch ? parseInt(indexMatch[1]) : 0;

        // Filter by type/index if specified
        if (imageType === 'cover' && !isCover) continue;
        if (imageType === 'gallery' && isCover) continue;
        if (imageType === 'gallery' && imageIndex !== undefined && fileIndex !== imageIndex) continue;

        // Download backup file
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('article-images')
          .download(`backups/${date}/${articleId}/${file.name}`);

        if (downloadError || !fileData) {
          console.error(`Download error: ${file.name}`, downloadError);
          continue;
        }

        // Upload to active location
        const destPath = `${articleId}/${file.name}`;
        const arrayBuffer = await fileData.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        const { error: uploadError } = await supabase.storage
          .from('article-images')
          .upload(destPath, uint8Array, {
            contentType: file.name.endsWith('.webp') ? 'image/webp' : 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          console.error(`Upload error: ${destPath}`, uploadError);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('article-images')
          .getPublicUrl(destPath);

        const publicUrl = urlData.publicUrl;

        // Update article in database
        if (isCover) {
          await supabase
            .from('content_articles')
            .update({ cover_image: publicUrl })
            .eq('id', articleId);
          restored.cover++;
        } else {
          // Update gallery image at specific index
          const { data: article } = await supabase
            .from('content_articles')
            .select('gallery_images')
            .eq('id', articleId)
            .maybeSingle();

          if (article) {
            const gallery = (article.gallery_images as string[] | null) || [];
            while (gallery.length <= fileIndex) gallery.push('');
            gallery[fileIndex] = publicUrl;
            await supabase
              .from('content_articles')
              .update({ gallery_images: gallery })
              .eq('id', articleId);
          }
          restored.gallery++;
        }
      }

      return new Response(
        JSON.stringify({ success: true, restored }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    console.error('Restore error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
