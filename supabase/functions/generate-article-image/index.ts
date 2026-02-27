import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const subjectTranslations: Record<string, string> = {
  'horta de ervas': 'herb garden', 'horta': 'vegetable garden', 'ervas': 'herb garden',
  'ervas aromáticas': 'aromatic herb garden', 'temperos': 'herb and spice garden',
  'flores ornamentais': 'ornamental flowers', 'flores': 'flower garden',
  'orquídeas': 'orchids', 'rosas': 'rose garden', 'girassol': 'sunflower garden',
  'arquitetura colonial': 'colonial architecture exterior facade, classic columns, ornate balconies, historical building front view',
  'arquitetura moderna': 'modern architecture exterior facade, clean lines, large glass windows, contemporary building exterior',
  'arquitetura contemporânea': 'contemporary architecture exterior facade, innovative design, bold geometric shapes, building front view',
  'arquitetura sustentável': 'sustainable green architecture exterior, eco-friendly building facade, living walls, solar panels on roof',
  'arquitetura minimalista': 'minimalist architecture exterior facade, simple geometric forms, white walls, clean building exterior',
  'arquitetura industrial': 'industrial architecture exterior, exposed steel beams, brick facade, warehouse-style building exterior',
  'arquitetura': 'stunning architecture exterior facade, building front view, structural design, outdoor perspective',
  'colonial': 'colonial style building exterior facade, classic architecture, ornamental details, front view of house',
  'industrial': 'industrial style building exterior, exposed brick and steel facade, urban architecture, street view',
  'moderno': 'modern building exterior facade, contemporary architecture, glass and concrete, front view',
  'neolítico': 'neolithic stone architecture exterior, ancient stone structure, monumental building facade',
  'europeu': 'european style building exterior facade, elegant architecture, classical european front view',
  'nórdico': 'nordic architecture exterior facade, scandinavian design, wood and stone exterior, minimalist building',
  'nordico': 'nordic architecture exterior facade, scandinavian design, wood and stone exterior, minimalist building',
  'neo-clássico': 'neoclassical architecture exterior facade, grand columns, symmetrical building front view',
  'neo-classico': 'neoclassical architecture exterior facade, grand columns, symmetrical building front view',
  'neo clássico': 'neoclassical architecture exterior facade, grand columns, symmetrical building front view',
  'sustentável': 'sustainable green architecture exterior, eco-friendly building facade',
  'paisagismo': 'landscape design', 'compostagem': 'composting garden',
  'lareira': 'fireplace', 'jardim vertical': 'vertical garden', 'jardim': 'garden',
  'plantas de interior': 'indoor plants', 'plantas': 'plants',
  'suculentas': 'succulent plants', 'cactos': 'cactus plants',
  'decoração': 'home decor', 'pergolado': 'pergola', 'varanda': 'balcony garden',
  'piscina': 'swimming pool', 'churrasqueira': 'barbecue grill area',
  'cozinha': 'kitchen', 'sala de jantar': 'dining room',
  'sala de estar': 'living room', 'sala': 'living room',
  'quarto': 'bedroom', 'banheiro': 'bathroom', 'escritório': 'home office',
  'área gourmet': 'outdoor gourmet area with barbecue grill, bar counter, poolside entertaining space, covered patio with rustic wood and stone',
  'area gourmet': 'outdoor gourmet area with barbecue grill, bar counter, poolside entertaining space, covered patio with rustic wood and stone',
  'área de serviço': 'laundry room',
  'nomes e cuidados plantas e flores': 'beautiful flowering plant in garden setting, botanical photography',
  'nomes e cuidados': 'plant care and flower species, botanical garden',
  'hortas ervas e cuidados': 'fresh vegetable garden herbs organic farming photography',
  'hortaliça': 'fresh vegetable garden organic produce',
  'alface': 'fresh lettuce vegetable garden', 'couve': 'fresh kale collard greens garden',
  'cenoura': 'fresh carrots vegetable garden', 'tomate': 'fresh tomatoes vine garden',
  'manjericão': 'fresh basil herb garden', 'alecrim': 'fresh rosemary herb garden',
  'salsinha': 'fresh parsley herb garden', 'cebolinha': 'fresh chives herb garden',
  'rúcula': 'fresh arugula rocket garden', 'espinafre': 'fresh spinach garden',
  'iluminação': 'lighting design', 'móveis': 'furniture design',
  'tapete': 'rug and carpet design', 'cortina': 'curtain and drapes',
  'terraço': 'terrace garden', 'quintal': 'backyard garden',
};

function extractSubjectFromTitle(title: string): string {
  const lowerTitle = title.toLowerCase();
  // Sort by key length descending so multi-word phrases match first (e.g. "horta de ervas" before "horta")
  const sortedEntries = Object.entries(subjectTranslations).sort((a, b) => b[0].length - a[0].length);
  for (const [pt, en] of sortedEntries) {
    if (lowerTitle.includes(pt)) return en;
  }
  // Fallback: use the title itself as subject description instead of a generic "home interior"
  return title;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const {
      title, type = 'cover', customPrompt, visualContext, mainSubject,
      slug, articleId, imageIndex = 0, regenerate = false, category,
    } = await req.json();

    if (!title && !customPrompt) throw new Error("Title or customPrompt is required");

    const subject = mainSubject || extractSubjectFromTitle(title || '');
    
    // Detect architecture topics by category (primary) or subject keywords (fallback)
    const architectureCategories = ['colonial', 'industrial', 'moderno', 'neolítico', 'neolitico', 'europeu', 'nórdico', 'nordico', 'neo clássico', 'neo classico', 'neo-classico', 'arquitetura'];
    const architectureKeywords = ['architecture', 'facade', 'colonial architecture', 'industrial architecture', 'modern building', 'neolithic', 'european style', 'nordic architecture', 'neoclassical', 'sustainable green architecture', 'minimalist architecture', 'exterior facade', 'building exterior'];
    const categoryLower = (category || '').toLowerCase().trim();
    const isArchitectureSubject = architectureCategories.some(c => categoryLower === c || categoryLower.includes(c)) 
      || architectureKeywords.some(k => subject.toLowerCase().includes(k));
    
    console.log(`[ImageGen] Category: "${category}", Subject: "${subject}", isArchitecture: ${isArchitectureSubject}`);
    
    const exteriorSetting = 'stunning building exterior facade, street view, clear sky, professional architectural photography, natural daylight';
    const interiorSetting = 'beautiful home interior, professional photography, warm lighting';
    
    // For architecture: FORCE exterior setting, even overriding visualContext if it mentions "interior"
    let setting: string;
    if (isArchitectureSubject) {
      if (visualContext && !visualContext.toLowerCase().includes('interior')) {
        setting = visualContext;
      } else {
        setting = exteriorSetting;
      }
    } else {
      setting = visualContext || interiorSetting;
    }
    const antiTextClause = "no text, no words, no letters, no typography, no watermarks, no logos";

    let prompt: string;
    const photoStyle = isArchitectureSubject 
      ? 'Professional exterior architectural photography, building facade, outdoor perspective' 
      : 'Professional interior photography';
    
    if (type === 'cover') {
      const coverStyle = isArchitectureSubject
        ? `${subject}, stunning exterior facade photograph for architecture magazine. Environment: ${setting}. Wide 16:9 cinematic composition, building front view, outdoor perspective, ultra high resolution, sharp focus. ${antiTextClause}.`
        : `${subject}, professional hero photograph for home design magazine. Environment: ${setting}. Wide 16:9 cinematic composition, ultra high resolution, sharp focus. ${antiTextClause}.`;
      prompt = coverStyle;
    } else {
      const galleryDetail = customPrompt || 'detailed professional photography';
      if (isArchitectureSubject) {
        // For architecture: ALWAYS force exterior/facade keywords in gallery prompts
        const cleanedDetail = galleryDetail
          .replace(/\binterior\b/gi, 'exterior')
          .replace(/\bindoor\b/gi, 'outdoor')
          .replace(/\broom\b/gi, 'facade')
          .replace(/\bfurniture\b/gi, 'structural details')
          .replace(/\bliving room\b/gi, 'building exterior')
          .replace(/\bbedroom\b/gi, 'building facade')
          .replace(/\bkitchen\b/gi, 'entrance');
        prompt = `${subject}, exterior building facade, ${cleanedDetail}, outdoor architectural perspective. Setting: ${setting}. ${photoStyle}, sharp focus. ${antiTextClause}.`;
      } else {
        prompt = `${subject}, ${galleryDetail}. Setting: ${setting}. ${photoStyle}, sharp focus. ${antiTextClause}.`;
      }
    }

    console.log(`Generating ${type} image: ${prompt.substring(0, 100)}...`);

    const aspectRatio = type === 'cover' ? '16:9' : '4:3';

    // Call Replicate API
    const replicateResponse = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "wait",
      },
      body: JSON.stringify({
        input: {
          prompt,
          aspect_ratio: aspectRatio,
          output_format: "webp",
          output_quality: 85,
          num_outputs: 1,
          go_fast: true,
        },
      }),
    });

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text();
      throw new Error(`Replicate API error: ${replicateResponse.status} - ${errorText}`);
    }

    const prediction = await replicateResponse.json();
    let imageUrl: string | null = null;

    if (prediction.status === 'succeeded' && prediction.output) {
      imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    } else if (prediction.status === 'processing' || prediction.status === 'starting') {
      const pollUrl = prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`;
      for (let attempts = 0; attempts < 60; attempts++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const pollResponse = await fetch(pollUrl, {
          headers: { "Authorization": `Bearer ${REPLICATE_API_KEY}` },
        });
        const pollResult = await pollResponse.json();
        if (pollResult.status === 'succeeded') {
          imageUrl = Array.isArray(pollResult.output) ? pollResult.output[0] : pollResult.output;
          break;
        } else if (pollResult.status === 'failed' || pollResult.status === 'canceled') {
          throw new Error(`Prediction failed: ${pollResult.error || 'Unknown error'}`);
        }
      }
    }

    if (!imageUrl) throw new Error("No image was generated");

    // Download image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error(`Failed to download image: ${imageResponse.status}`);
    const imageBytes = new Uint8Array(await imageResponse.arrayBuffer());

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const safeSlug = (slug || 'article').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    const fileName = `${safeSlug}/${type}-${timestamp}-${randomId}.webp`;

    const { error: uploadError } = await supabase.storage
      .from('article-images')
      .upload(fileName, imageBytes, { contentType: 'image/webp', upsert: false });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('article-images')
      .getPublicUrl(fileName);

    // Update article if regenerating
    if (articleId && regenerate) {
      if (type === 'cover') {
        await supabase.from('content_articles').update({ cover_image: publicUrl }).eq('id', articleId);
      } else {
        const { data: article } = await supabase
          .from('content_articles')
          .select('gallery_images')
          .eq('id', articleId)
          .maybeSingle();
        if (article) {
          const gallery = (article.gallery_images as string[] | null) || [];
          gallery[imageIndex] = publicUrl;
          await supabase.from('content_articles').update({ gallery_images: gallery }).eq('id', articleId);
        }
      }
    }

    // Save metadata
    if (articleId) {
      await supabase.from('article_images').insert({
        article_id: articleId,
        image_type: type,
        image_index: type === 'cover' ? 0 : imageIndex,
        public_url: publicUrl,
        file_size: imageBytes.length,
        format: 'webp',
        prompt,
      });
    }

    return new Response(
      JSON.stringify({ success: true, imageUrl: publicUrl, prompt, type, fileSize: imageBytes.length, format: 'webp' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error generating image:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
