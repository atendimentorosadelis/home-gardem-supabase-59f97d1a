import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, excerpt, coverImageUrl } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `Create a professional Instagram Story image (9:16 portrait format) for a home & garden blog post.

The article is titled: "${title}"
${excerpt ? `Summary: "${excerpt.substring(0, 150)}"` : ''}

Design requirements:
- Portrait orientation (9:16 ratio), suitable for Instagram Stories and Reels
- Clean, modern, editorial design with elegant typography
- The title "${title}" should be prominently displayed as stylized text overlay
- Use warm, inviting colors related to home, garden, and interior design
- Include decorative botanical or architectural elements that complement the theme
- Add a subtle "Home & Garden" branding at the bottom
- Professional magazine-quality aesthetic
- Make the text readable and visually striking
- Do NOT include any phone UI elements, status bars, or device frames

Ultra high resolution, photographic quality.`;

    const messages: any[] = [
      {
        role: 'user',
        content: coverImageUrl 
          ? [
              { type: 'text', text: prompt + '\n\nUse this article cover image as visual reference and inspiration for the color palette and theme:' },
              { type: 'image_url', image_url: { url: coverImageUrl } }
            ]
          : prompt
      }
    ];

    console.log('Generating Instagram Story image...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages,
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      throw new Error('No image generated');
    }

    // Upload to Supabase Storage
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `instagram/story-${Date.now()}.png`;

    const uploadResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/article-images/${fileName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'image/png',
          'x-upsert': 'true',
        },
        body: binaryData,
      }
    );

    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.text();
      console.error('Storage upload error:', uploadError);
      throw new Error('Failed to upload image to storage');
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/article-images/${fileName}`;

    console.log('Instagram Story image generated and uploaded:', publicUrl);

    return new Response(
      JSON.stringify({ imageUrl: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Instagram image generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Image generation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
