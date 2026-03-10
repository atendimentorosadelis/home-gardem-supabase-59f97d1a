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
  'decoração': 'home decor', 'pergolado': 'pergola', 'varanda': 'beautiful covered veranda, outdoor porch with comfortable seating, cozy balcony living space',
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
  'dicas de pintura': 'wall painting techniques and textures, paint roller on wall, vibrant colors',
  'pintura': 'wall painting techniques, paint roller, fresh painted wall, vibrant colors',
  'textura': 'decorative wall texture finish, grafiato texture, artistic wall coating',
  'cimento queimado': 'burnt cement wall finish, polished concrete texture, modern industrial wall',
  'grafiato': 'grafiato textured wall finish, decorative plaster texture, exterior wall coating',
  'verniz': 'wood varnish application, glossy wood finish, woodworking protection coating',
  'tinta': 'interior wall paint colors, paint swatches, home painting project',
  // Carpintaria Americana
  'wood framing': 'American wood frame house under construction, lumber skeletal structure, residential framing',
  'timber framing': 'traditional timber frame construction, post-and-beam joinery, heavy timber structure',
  'carpintaria': 'American wood frame residential construction, lumber framing, house building site',
  'carpentry': 'American residential carpentry, wood frame house construction',
  'radiant floor': 'radiant heated floor installation in wood frame house, PEX tubing, hydronic heating system',
  'piso aquecido': 'radiant heated floor installation in wood frame house, PEX tubing, hydronic heating system',
  'insulation': 'fiberglass batt insulation installed between wood studs, thermal barrier, vapor barrier',
  'isolamento': 'fiberglass batt insulation installed between wood studs, thermal barrier in wood frame wall',
  'lumber': 'stacked dimensional lumber at construction site, 2x4 and 2x6 boards, pressure-treated wood',
  'madeira estrutural': 'structural lumber framing, dimensional wood beams, American residential construction',
  'wood maintenance': 'wood deck staining and sealing, timber preservation treatment, exterior wood care',
  'wood preservation': 'pressure-treated lumber, borate wood treatment, anti-fungal wood protection',
};

// Map architecture category slugs to detailed style-specific prompts
const architectureStylePrompts: Record<string, { subject: string; details: string }> = {
  'colonial': {
    subject: 'colonial architecture exterior facade, classic columns, ornate balconies, historical building front view, symmetrical design',
    details: 'colonial style building with terracotta roof tiles, arched doorways, wrought iron railings, whitewashed walls, cobblestone courtyard',
  },
  'industrial': {
    subject: 'industrial architecture exterior, exposed steel beams, brick facade, warehouse-style building exterior, raw materials',
    details: 'industrial loft building with metal cladding, large factory windows, steel structural framework, urban gritty setting, concrete and steel',
  },
  'moderno': {
    subject: 'modern contemporary architecture exterior facade, clean geometric lines, floor-to-ceiling glass windows, minimalist design',
    details: 'modern building with flat roof, cantilevered volumes, white and concrete surfaces, infinity pool, sleek landscaping',
  },
  'neolitico': {
    subject: 'neolithic stone architecture exterior, ancient megalithic structure, massive stone blocks, monumental building facade',
    details: 'primitive stone construction, dolmen-inspired design, rough-hewn boulders, earthen materials, prehistoric monument aesthetic',
  },
  'europeu': {
    subject: 'european classical architecture exterior facade, elegant ornamental stonework, grand entrance, mansard roof',
    details: 'Haussmann-style building, Parisian balconies, carved stone cornices, tall shuttered windows, wrought iron details, cobblestone street',
  },
  'nordico': {
    subject: 'nordic scandinavian architecture exterior facade, minimalist wood and glass design, nature-integrated building',
    details: 'Scandinavian cabin with dark timber cladding, large panoramic windows, green roof, snow-covered landscape, birch trees, fjord setting',
  },
  'neo-classico': {
    subject: 'neoclassical architecture exterior facade, grand Corinthian columns, symmetrical pediment, monumental staircase',
    details: 'neoclassical building with marble facade, ionic or corinthian columns, triangular pediment, balanced proportions, formal gardens',
  },
  'arquitetura': {
    subject: 'stunning architecture exterior facade, building front view, structural design, outdoor perspective',
    details: 'impressive architectural structure, professional exterior photography, clear sky, landscaped surroundings',
  },
};

// Map carpentry topic slugs to specific image prompts
const carpentryStylePrompts: Record<string, { subject: string; details: string }> = {
  'carpintaria-historia': {
    subject: 'historical American wood frame house construction, vintage carpentry, early American building techniques',
    details: 'old wooden barn raising, hand-hewn timber beams, historical homestead construction, rustic pioneer craftsmanship, sepia-toned woodworking',
  },
  'carpintaria-wood-framing': {
    subject: 'American wood frame house under construction, 2x4 lumber stud wall framing, residential building site',
    details: 'workers assembling wood stud walls, plywood sheathing, floor joists, roof trusses, suburban American neighborhood construction site',
  },
  'carpintaria-tipos-madeira': {
    subject: 'variety of dimensional lumber stacked at lumberyard, Douglas fir, Southern pine, Cedar planks',
    details: 'cross-section of different wood species, grain patterns, pressure-treated green lumber, kiln-dried boards, Home Depot lumber aisle',
  },
  'carpintaria-isolamento': {
    subject: 'fiberglass batt insulation installed between wood studs in American home wall cavity',
    details: 'pink fiberglass insulation, spray foam application, rigid foam board, vapor barrier installation, R-value thermal protection',
  },
  'carpintaria-aquecimento': {
    subject: 'radiant heated floor PEX tubing installation on wood subfloor in American home',
    details: 'hydronic radiant floor heating system, PEX tubes in concrete slab, forced air HVAC ductwork, thermostat control panel, cozy warm living space',
  },
  'carpintaria-manutencao': {
    subject: 'wood deck staining and sealing maintenance, timber preservation treatment on American home',
    details: 'exterior wood siding repair, pressure washing deck, applying wood sealant, replacing rotted boards, pest damage inspection',
  },
  'carpintaria-eficiencia': {
    subject: 'energy-efficient American wood frame house with insulation, air sealing, and weatherization',
    details: 'blower door test, thermal imaging camera showing heat loss, double-pane windows, house wrap installation, energy star certified home',
  },
  'carpintaria-tecnicas': {
    subject: 'comparison of traditional hand-cut timber joinery and modern nail gun wood framing techniques',
    details: 'mortise and tenon joint alongside modern pneumatic nail gun, hand tools and power tools, old barn frame next to modern stud wall',
  },
};

function extractSubjectFromTitle(title: string): string {
  const lowerTitle = title.toLowerCase();
  const sortedEntries = Object.entries(subjectTranslations).sort((a, b) => b[0].length - a[0].length);
  for (const [pt, en] of sortedEntries) {
    if (lowerTitle.includes(pt)) return en;
  }
  return title;
}

// Translate all Portuguese terms found in a prompt string to English equivalents
function translatePromptTerms(prompt: string): string {
  let translated = prompt;
  const sortedEntries = Object.entries(subjectTranslations).sort((a, b) => b[0].length - a[0].length);
  for (const [pt, en] of sortedEntries) {
    const regex = new RegExp(pt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    translated = translated.replace(regex, en);
  }
  return translated;
}

function detectPaintingTechniqueFromText(text: string): string | null {
  const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const techniqueMap: Array<{ keys: string[]; subject: string }> = [
    {
      keys: ['cimento queimado', 'burnt cement', 'concrete effect', 'concrete wall'],
      subject: 'burnt cement wall finish, polished concrete texture, modern industrial wall',
    },
    {
      keys: ['grafiato', 'textura acrilica', 'textured plaster'],
      subject: 'grafiato textured wall finish, decorative plaster texture, artisan wall coating',
    },
    {
      keys: ['verniz', 'wood varnish', 'envernizar', 'acabamento de madeira'],
      subject: 'wood varnish application, glossy wood finish, woodworking protection coating',
    },
    {
      keys: ['textura', 'efeito textura', 'textured wall'],
      subject: 'decorative wall texture finish, artistic wall coating, tactile plaster details',
    },
    {
      keys: ['tinta', 'paint', 'pintura'],
      subject: 'interior wall paint colors, roller application, wall preparation and finish',
    },
  ];

  for (const technique of techniqueMap) {
    if (technique.keys.some((k) => normalized.includes(k))) {
      return technique.subject;
    }
  }

  return null;
}

function isGenericPaintingSubject(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    normalized.includes('wall painting techniques') ||
    normalized.includes('paint roller') ||
    normalized.includes('home design')
  );
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

    const { data: articleContext } = articleId
      ? await supabase
          .from('content_articles')
          .select('title, category, category_slug, main_subject, visual_context, excerpt, body')
          .eq('id', articleId)
          .maybeSingle()
      : { data: null as any };

    const effectiveCategory = category || articleContext?.category_slug || articleContext?.category || '';

    // Detect architecture by category FIRST (most reliable), then by title/subject
    const architectureCategories = ['colonial', 'industrial', 'moderno', 'neolítico', 'neolitico', 'europeu', 'nórdico', 'nordico', 'neo clássico', 'neo classico', 'neo-classico', 'arquitetura'];
    const categoryLower = effectiveCategory.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const categoryNormalized = effectiveCategory.toLowerCase().trim();
    
    // Find the matching architecture style from category
    let matchedArchStyle: string | null = null;
    for (const key of Object.keys(architectureStylePrompts)) {
      const keyNorm = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (categoryLower === keyNorm || categoryLower.includes(keyNorm) || categoryNormalized === key || categoryNormalized.includes(key)) {
        matchedArchStyle = key;
        break;
      }
    }
    
    // Also check title for architecture keywords if category didn't match
    if (!matchedArchStyle) {
      const lowerTitle = (title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      for (const key of Object.keys(architectureStylePrompts)) {
        const keyNorm = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (lowerTitle.includes(keyNorm)) {
          matchedArchStyle = key;
          break;
        }
      }
    }
    
    const isArchitectureSubject = !!matchedArchStyle;
    
    // For architecture: use the STYLE-SPECIFIC subject instead of generic extraction
    let subject: string;
    if (isArchitectureSubject && matchedArchStyle) {
      subject = architectureStylePrompts[matchedArchStyle].subject;
    } else {
      const translatedMainSubject = mainSubject ? extractSubjectFromTitle(mainSubject) : null;
      const mainSubjectTranslated = translatedMainSubject && translatedMainSubject !== mainSubject
        ? translatedMainSubject
        : null;
      subject = mainSubjectTranslated || extractSubjectFromTitle(title || articleContext?.title || '');
    }

    const combinedContext = [
      mainSubject,
      visualContext,
      customPrompt,
      title,
      articleContext?.main_subject,
      articleContext?.visual_context,
      articleContext?.excerpt,
      articleContext?.body,
    ].filter(Boolean).join(' | ');

    const isPaintingCategory = categoryLower.includes('pintura') || categoryLower.includes('dicas-de-pintura');
    if (isPaintingCategory) {
      const detectedTechnique = detectPaintingTechniqueFromText(combinedContext);
      if (detectedTechnique && (!subject || isGenericPaintingSubject(subject))) {
        subject = detectedTechnique;
      }
    }

    const archDetails = matchedArchStyle ? architectureStylePrompts[matchedArchStyle].details : '';

    console.log(`[ImageGen] Category: "${effectiveCategory}", MatchedStyle: "${matchedArchStyle}", Subject: "${subject.substring(0, 80)}...", isArchitecture: ${isArchitectureSubject}`);
    
    const exteriorSetting = 'stunning building exterior facade, street view, clear sky, professional architectural photography, natural daylight';
    const interiorSetting = 'beautiful home interior, professional photography, warm lighting';
    
    const resolvedVisualContext = visualContext || articleContext?.visual_context || '';

    let setting: string;
    if (isArchitectureSubject) {
      if (resolvedVisualContext && !resolvedVisualContext.toLowerCase().includes('interior')) {
        setting = resolvedVisualContext;
      } else {
        setting = exteriorSetting;
      }
    } else {
      setting = resolvedVisualContext || interiorSetting;
    }
    const antiTextClause = "no text, no words, no letters, no typography, no watermarks, no logos";

    let prompt: string;
    const photoStyle = isArchitectureSubject 
      ? 'Professional exterior architectural photography, building facade, outdoor perspective' 
      : 'Professional interior photography';
    
    if (type === 'cover') {
      if (isArchitectureSubject) {
        prompt = `${subject}, ${archDetails}, stunning exterior facade photograph for architecture magazine. Environment: ${setting}. Wide 16:9 cinematic composition, building front view, outdoor perspective, ultra high resolution, sharp focus. ${antiTextClause}.`;
      } else {
        prompt = `${subject}, professional hero photograph for home design magazine. Environment: ${setting}. Wide 16:9 cinematic composition, ultra high resolution, sharp focus. ${antiTextClause}.`;
      }
    } else {
      let galleryDetail = customPrompt || 'detailed professional photography';
      // Translate Portuguese terms in gallery prompts to English
      galleryDetail = translatePromptTerms(galleryDetail);

      const paintingTechniqueDetail = isPaintingCategory ? detectPaintingTechniqueFromText(`${galleryDetail} | ${combinedContext}`) : null;
      if (paintingTechniqueDetail && isGenericPaintingSubject(subject)) {
        subject = paintingTechniqueDetail;
      }
      if (isArchitectureSubject) {
        // Strip any interior keywords from the gallery detail
        const cleanedDetail = galleryDetail
          .replace(/\binterior\b/gi, 'exterior')
          .replace(/\bindoor\b/gi, 'outdoor')
          .replace(/\broom\b/gi, 'facade')
          .replace(/\bfurniture\b/gi, 'structural details')
          .replace(/\bliving room\b/gi, 'building exterior')
          .replace(/\bbedroom\b/gi, 'building facade')
          .replace(/\bkitchen\b/gi, 'entrance');
        // Include BOTH the style subject AND the style details for consistency
        prompt = `${subject}, ${archDetails}, ${cleanedDetail}, outdoor architectural perspective. Setting: ${setting}. ${photoStyle}, sharp focus. ${antiTextClause}.`;
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
