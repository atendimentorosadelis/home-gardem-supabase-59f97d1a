import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const subjectTranslations: Record<string, string> = {
  'lareira': 'fireplace', 'jardim': 'garden', 'plantas': 'plants',
  'suculentas': 'succulent plants', 'cactos': 'cactus plants',
  'decoração': 'home decor', 'pergolado': 'pergola', 'varanda': 'balcony',
  'piscina': 'swimming pool', 'churrasqueira': 'barbecue grill',
  'cozinha': 'kitchen', 'sala de jantar': 'dining room',
  'sala de estar': 'living room', 'sala': 'living room',
  'quarto': 'bedroom', 'banheiro': 'bathroom', 'escritório': 'home office',
  'área gourmet': 'gourmet area', 'área de serviço': 'laundry room',
};

function extractSubjectFromTitle(title: string): string {
  const lowerTitle = title.toLowerCase();
  for (const [pt, en] of Object.entries(subjectTranslations)) {
    if (lowerTitle.includes(pt)) return en;
  }
  return 'home interior design element';
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

    const { title, excerpt, mainSubject, visualContext } = await req.json();

    if (!title) throw new Error("Title is required");

    const subject = mainSubject || extractSubjectFromTitle(title);
    const setting = visualContext || 'beautiful home environment, professional photography, warm natural lighting';
    const antiTextClause = "no text, no words, no letters, no typography, no watermarks, no logos";

    const prompt = `${subject}, stunning portrait photograph for Instagram Stories. Vertical 9:16 composition, ${setting}. Editorial home and garden magazine quality, vibrant colors, dreamy atmosphere, ultra high resolution, sharp focus. ${antiTextClause}.`;

    console.log(`Generating Instagram Story image: ${prompt.substring(0, 100)}...`);

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
          aspect_ratio: "9:16",
          output_format: "webp",
          output_quality: 90,
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
    const fileName = `instagram/story-${timestamp}-${randomId}.webp`;

    const { error: uploadError } = await supabase.storage
      .from('article-images')
      .upload(fileName, imageBytes, { contentType: 'image/webp', upsert: false });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('article-images')
      .getPublicUrl(fileName);

    console.log('Instagram Story image generated:', publicUrl);

    return new Response(
      JSON.stringify({ success: true, imageUrl: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error generating Instagram image:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
