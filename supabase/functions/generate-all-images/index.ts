import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// This project's Supabase URL for calling other edge functions
const SUPABASE_FUNCTIONS_URL = 'https://xfhtixubllcdockbkbwm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmaHRpeHVibGxjZG9ja2JrYndtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MjY4ODAsImV4cCI6MjA4NzMwMjg4MH0.JRQHxGOZ-7L0C2D1m_vRmKHDfvdJaEhF3OuU32QSQFI';

interface ImageResult {
  index: number;
  type: 'cover' | 'gallery';
  success: boolean;
  imageUrl?: string;
  error?: string;
}

async function generateSingleImage(params: {
  index: number;
  type: 'cover' | 'gallery';
  prompt: string;
  title: string;
  slug: string;
  mainSubject: string;
  visualContext: string;
  articleId: string;
}): Promise<ImageResult> {
  const { index, type, prompt, title, slug, mainSubject, visualContext, articleId } = params;

  console.log(`[Image ${index}] Starting ${type} generation...`);

  try {
    const response = await fetch(
      `${SUPABASE_FUNCTIONS_URL}/functions/v1/generate-article-image`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          customPrompt: prompt,
          mainSubject,
          visualContext,
          title,
          type,
          slug,
          articleId,
          imageIndex: type === 'gallery' ? index - 1 : 0,
          fromQueue: false,
          regenerate: true,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { index, type, success: false, error: `HTTP ${response.status}: ${errorText.substring(0, 100)}` };
    }

    const result = await response.json();
    if (!result.success || !result.imageUrl) {
      return { index, type, success: false, error: result.error || 'No image URL returned' };
    }

    console.log(`[Image ${index}] Success`);
    return { index, type, success: true, imageUrl: result.imageUrl };

  } catch (error) {
    return { index, type, success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleId, title, slug, mainSubject, visualContext, coverPrompt, galleryPrompts } = await req.json();

    if (!articleId) throw new Error('articleId is required');
    if (!galleryPrompts || !Array.isArray(galleryPrompts)) throw new Error('galleryPrompts must be an array');

    console.log(`[GenerateAllImages] Starting for article ${articleId}`);

    const finalCoverPrompt = coverPrompt ||
      `${mainSubject}, professional hero photograph for home design magazine. Environment: ${visualContext}. Wide 16:9 cinematic composition, no text, no watermarks.`;

    const normalizedGalleryPrompts = [...galleryPrompts];
    while (normalizedGalleryPrompts.length < 5) {
      normalizedGalleryPrompts.push(`${mainSubject}, detail shot ${normalizedGalleryPrompts.length + 1}, ${visualContext}, professional photography`);
    }
    const finalGalleryPrompts = normalizedGalleryPrompts.slice(0, 5);

    // Generate all 6 images in parallel
    const imagePromises: Promise<ImageResult>[] = [];

    imagePromises.push(generateSingleImage({
      index: 0, type: 'cover', prompt: finalCoverPrompt,
      title, slug, mainSubject, visualContext, articleId,
    }));

    for (let i = 0; i < finalGalleryPrompts.length; i++) {
      imagePromises.push(generateSingleImage({
        index: i + 1, type: 'gallery', prompt: finalGalleryPrompts[i],
        title, slug, mainSubject, visualContext, articleId,
      }));
    }

    const startTime = Date.now();
    const results = await Promise.all(imagePromises);
    const duration = Date.now() - startTime;

    const coverResult = results.find(r => r.type === 'cover');
    const galleryResults = results.filter(r => r.type === 'gallery').sort((a, b) => a.index - b.index);
    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`[GenerateAllImages] ${succeeded} succeeded, ${failed} failed in ${duration}ms`);

    // Update article
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const galleryImages: string[] = [];
    for (let i = 0; i < 5; i++) {
      const result = galleryResults.find(r => r.index === i + 1);
      galleryImages.push(result?.success && result.imageUrl ? result.imageUrl : '');
    }

    const updateData: Record<string, unknown> = {
      gallery_images: galleryImages,
      updated_at: new Date().toISOString(),
    };
    if (coverResult?.success && coverResult.imageUrl) {
      updateData.cover_image = coverResult.imageUrl;
    }

    await supabase.from('content_articles').update(updateData).eq('id', articleId);

    return new Response(
      JSON.stringify({
        success: true, articleId, totalImages: 6, succeeded, failed, durationMs: duration,
        coverImage: coverResult?.imageUrl || null, galleryImages,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[GenerateAllImages] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
