import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const subjectTranslations: Record<string, string> = {
  'decoração de jardim': 'garden decoration, outdoor garden with decorative elements, ornamental garden design',
  'decoracao de jardim': 'garden decoration, outdoor garden with decorative elements, ornamental garden design',
  'decoracao-jardim': 'garden decoration, outdoor garden with decorative elements, ornamental garden design',
  'dicas de decoração de jardim': 'garden decoration tips, outdoor garden styling, ornamental plants and garden accessories',
  'jardim decorado': 'decorated garden, ornamental outdoor garden with pathways and lighting',
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

function isConstructionFocusedText(text: string): boolean {
  const normalized = (text || '').toLowerCase();
  const constructionMarkers = [
    'house under construction',
    'construction site',
    'skeletal structure',
    'roof trusses',
    'wall studs',
    'building frame',
    'wood frame house',
    'residential framing',
  ];
  return constructionMarkers.some((marker) => normalized.includes(marker));
}

function sanitizeWoodTypesPrompt(prompt: string): string {
  return (prompt || '')
    .replace(/house under construction/gi, 'wood species comparison')
    .replace(/construction site/gi, 'lumberyard scene')
    .replace(/skeletal structure/gi, 'organized wood samples')
    .replace(/roof trusses?/gi, 'grain texture details')
    .replace(/wall studs?/gi, 'finished and raw boards')
    .replace(/building frame/gi, 'material bench layout')
    .replace(/american construction/gi, 'woodworking editorial')
    .replace(/\s+/g, ' ')
    .trim();
}

const GENERIC_CARPENTRY_PROMPT_MARKERS = [
  'wood frame house construction',
  'skeletal structure',
  'roof trusses',
  'wall studs',
  'suburban lot',
  'under construction',
  'building materials organized',
];

const CARPENTRY_GALLERY_FALLBACKS: Record<string, string[]> = {
  'carpintaria-historia': [
    'historical evolution of American carpentry with handcrafted timber elements and archival woodworking tools',
    'traditional mortise and tenon joinery close-up with aged wood texture and hand tool marks',
    'comparative timeline scene showing early timber framing and later standardized carpentry methods',
    'macro documentation of vintage fasteners, timber wear patterns, and restoration references',
    'workbench composition with old plans, measuring tools, and historical construction notes',
    'editorial storytelling frame connecting legacy techniques to current carpentry practices',
  ],
  'carpintaria-wood-framing': [
    'platform framing layout with aligned stud walls, floor deck, and structural sequencing',
    'close-up of framing connectors, nailing patterns, and structural bracing details',
    'interior framing perspective highlighting openings, spans, and load path continuity',
    'roof framing geometry with truss integration and sheathing preparation details',
    'side view of sheathing and weather barrier transitions on framed wall assemblies',
    'construction workflow scene with lumber staging and framing quality checkpoints',
  ],
  'carpintaria-tipos-madeira': [
    'comparative lineup of wood species boards organized by color, density, and intended structural use',
    'close-up of grain texture, knots, and cut quality across multiple wood species samples',
    'cross-section comparison of boards showing ring patterns, moisture behavior, and density differences',
    'finish test panel with raw wood, sealer, and varnish outcomes on selected species',
    'technical labeling scene with lumber grades, moisture meter readings, and species identifiers',
    'editorial composition with organized material samples and woodworking measuring tools',
  ],
  'carpintaria-isolamento': [
    'wood wall assembly layers with thermal and acoustic insulation continuity and cavity detailing',
    'insulation fit close-up between framing members with no compression gaps and airtight transitions',
    'cutaway perspective of vapor control membrane and sealing around penetrations',
    'acoustic detail showing resilient interfaces and insulation around service points',
    'thermal diagnostic setup illustrating heat-loss mapping in insulated wood assemblies',
    'comparative insulation board with performance notes for multiple climate conditions',
  ],
  'carpintaria-aquecimento': [
    'radiant floor tubing layout integrated with wood subfloor and heating zone planning',
    'manifold connection detail with loop spacing and balancing strategy for radiant systems',
    'floor assembly cutaway showing heat transfer layers and insulation support',
    'HVAC routing detail through wood structure with thermal protection and air sealing',
    'control panel scene with thermostat zoning and commissioning parameters',
    'comparison of radiant and forced-air heating solutions adapted to wood construction',
  ],
  'carpintaria-manutencao': [
    'maintenance workflow with wood elements sorted by inspection status and repair priority',
    'close-up of moisture damage, cracking patterns, and biological wear indicators',
    'surface preparation detail before protective treatment with sanding and cleaning stages',
    'preservative and sealer application on wood components with correct coating sequence',
    'repair detail showing reinforcement and replacement inserts for deteriorated areas',
    'before-and-after documentation scene with maintenance checklist and restored pieces',
  ],
  'carpintaria-eficiencia': [
    'high-performance wood envelope assembly with airtight continuity and insulation strategy',
    'air-sealing transition detail at critical framing joints and sheathing interfaces',
    'window perimeter insulation setup reducing thermal bridging in wood wall systems',
    'thermal imaging capture of energy-loss points and corrected envelope detailing',
    'mechanical integration scene with controlled ventilation and insulated distribution paths',
    'performance comparison board with efficiency metrics and retrofit priorities',
  ],
  'carpintaria-tecnicas': [
    'side-by-side carpentry workflow comparing traditional joinery and modern framing execution',
    'close-up of handcrafted joinery precision next to pneumatic fastening technique',
    'tooling comparison showing hand tools and modern power equipment in practical use',
    'layout and measurement process scene with sequencing notes for each method',
    'structural behavior comparison between traditional and contemporary wood assemblies',
    'editorial synthesis frame highlighting method selection by project constraints',
  ],
};

function extractMarkdownHeadings(markdown?: string, max: number = 8): string[] {
  if (!markdown) return [];
  return [...markdown.matchAll(/^##+\s+(.+)$/gm)]
    .map((match) => (match[1] || '').replace(/[*_`]/g, '').trim())
    .filter((heading) => heading.length >= 6)
    .slice(0, max);
}

function hasGenericCarpentryBias(text: string): boolean {
  const normalized = (text || '').toLowerCase();
  const hits = GENERIC_CARPENTRY_PROMPT_MARKERS.filter((marker) => normalized.includes(marker)).length;
  return hits >= 2;
}

const GENERIC_THEME_PROMPT_MARKERS = [
  'same room same decor same lighting',
  'wide-angle front view establishing shot',
  'close-up macro shot',
  'side perspective view',
  'low angle dramatic shot',
  'high angle bird eye overview',
  'under construction',
  'suburban lot',
  'house under construction',
  'building materials organized',
];

function isThemeDrivenPrompt(prompt: string): boolean {
  const normalized = (prompt || '').toLowerCase();
  if (!normalized) return false;
  return GENERIC_THEME_PROMPT_MARKERS.some((marker) => normalized.includes(marker));
}

function buildSectionDrivenDetail(params: {
  customPrompt?: string;
  headingHints: string[];
  excerpt?: string;
  title?: string;
  imageIndex: number;
  regenerate: boolean;
}): string {
  const { customPrompt, headingHints, excerpt, title, imageIndex, regenerate } = params;

  const headingHint =
    headingHints[imageIndex] ||
    headingHints[0] ||
    (excerpt || '').trim() ||
    (title || '').trim() ||
    '';

  const translatedPrompt = translatePromptTerms(customPrompt || '').trim();
  const promptIsGeneric = isThemeDrivenPrompt(translatedPrompt);

  if (regenerate) {
    if (headingHint) {
      if (!translatedPrompt || promptIsGeneric) {
        return `article section focus: ${headingHint}`;
      }
      if (!translatedPrompt.toLowerCase().includes(headingHint.toLowerCase())) {
        return `${translatedPrompt}, article section focus: ${headingHint}`;
      }
    }

    if (!translatedPrompt || promptIsGeneric) {
      return 'article-driven visual detail with emphasis on the generated content section';
    }

    return translatedPrompt;
  }

  if (translatedPrompt) return translatedPrompt;
  if (headingHint) return `article section focus: ${headingHint}`;
  return 'detailed professional photography';
}

function resolveCarpentryGalleryDetail(params: {
  style: string | null;
  customPrompt?: string;
  imageIndex: number;
  articleTitle?: string;
  articleExcerpt?: string;
  articleBody?: string;
  isWoodTypesTopic: boolean;
}): string {
  const {
    style,
    customPrompt,
    imageIndex,
    articleTitle,
    articleExcerpt,
    articleBody,
    isWoodTypesTopic,
  } = params;

  const fallbackList = CARPENTRY_GALLERY_FALLBACKS[style || ''] || CARPENTRY_GALLERY_FALLBACKS['carpintaria-tecnicas'];
  const fallbackDetail = fallbackList[imageIndex] || fallbackList[0];
  const translatedPrompt = translatePromptTerms(customPrompt || '').trim();
  const isFramingStyle = style === 'carpintaria-wood-framing';

  const shouldUseFallback =
    !translatedPrompt ||
    translatedPrompt.length < 28 ||
    (!isFramingStyle && hasGenericCarpentryBias(translatedPrompt));

  let detail = shouldUseFallback ? fallbackDetail : translatedPrompt;

  if (isWoodTypesTopic) {
    detail = sanitizeWoodTypesPrompt(detail);
  }

  const headingHints = extractMarkdownHeadings(articleBody, 6);
  const headingHint = headingHints[imageIndex] || headingHints[0] || articleExcerpt || articleTitle || '';
  if (headingHint && !detail.toLowerCase().includes(headingHint.toLowerCase())) {
    detail = `${detail}, article section focus: ${headingHint}`;
  }

  return detail;
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
      articleBody, articleExcerpt,
    } = await req.json();

    if (!title && !customPrompt) throw new Error("Title or customPrompt is required");

    const { data: articleContext } = articleId
      ? await supabase
          .from('content_articles')
          .select('title, category, category_slug, main_subject, visual_context, excerpt, body, gallery_prompts')
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

    // Detect carpentry by category or title
    let matchedCarpentryStyle: string | null = null;
    const isCarpentryCategory = categoryLower.includes('carpintaria') || categoryNormalized.includes('carpintaria');
    if (isCarpentryCategory) {
      for (const key of Object.keys(carpentryStylePrompts)) {
        const keyNorm = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (categoryLower.includes(keyNorm) || categoryNormalized.includes(key) || categoryNormalized === key) {
          matchedCarpentryStyle = key;
          break;
        }
      }
    }
    // Check title for carpentry keywords
    if (!matchedCarpentryStyle) {
      const lowerTitle = (title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const carpentryTitleKeywords = ['wood frame', 'wood framing', 'timber frame', 'timber framing', 'carpentry', 'carpintaria', 'lumber', 'radiant floor', 'radiant heat', 'piso aquecido', 'insulation', 'isolamento'];
      if (carpentryTitleKeywords.some(k => lowerTitle.includes(k))) {
        // Try to match a specific style from title
        for (const key of Object.keys(carpentryStylePrompts)) {
          const keyNorm = key.replace('carpintaria-', '').replace(/-/g, ' ');
          if (lowerTitle.includes(keyNorm)) {
            matchedCarpentryStyle = key;
            break;
          }
        }
        // Default to wood-framing if carpentry detected but no specific match
        if (!matchedCarpentryStyle) matchedCarpentryStyle = 'carpintaria-wood-framing';
      }
    }

    const isCarpentrySubject = !!matchedCarpentryStyle;

    // Resolve the effective mainSubject from article data (priority) or request params
    const effectiveMainSubject = mainSubject || articleContext?.main_subject || '';
    const effectiveVisualContext = visualContext || articleContext?.visual_context || '';
    const hasArticleSpecificData = effectiveMainSubject.trim().length > 10;
    const carpentryContextText = `${effectiveCategory} ${title || ''} ${effectiveMainSubject} ${articleContext?.main_subject || ''}`.toLowerCase();
    const isWoodTypesTopic =
      matchedCarpentryStyle === 'carpintaria-tipos-madeira' ||
      /tipos?.*madeira|wood\s+species|douglas\s+fir|southern\s+pine|cedar|redwood|grain\s+pattern|lumber\s+grade/.test(carpentryContextText);

    // For architecture or carpentry: use article-specific data FIRST, static mappings as FALLBACK
    let subject: string;
    if (isArchitectureSubject && matchedArchStyle) {
      // Architecture always uses style-specific prompts (exterior facades)
      subject = architectureStylePrompts[matchedArchStyle].subject;
    } else if (isCarpentrySubject && hasArticleSpecificData) {
      const isInvalidForWoodTypes = isWoodTypesTopic && isConstructionFocusedText(effectiveMainSubject);
      if (isInvalidForWoodTypes) {
        subject = carpentryStylePrompts['carpintaria-tipos-madeira'].subject;
        console.log('[ImageGen] Replacing construction-biased mainSubject with wood-types fallback subject');
      } else {
        subject = effectiveMainSubject;
        console.log(`[ImageGen] Using article-specific subject for carpentry: "${subject.substring(0, 80)}..."`);
      }
    } else if (isCarpentrySubject && matchedCarpentryStyle) {
      // Carpentry fallback: use static style prompts only when no article data
      subject = carpentryStylePrompts[matchedCarpentryStyle].subject;
      console.log(`[ImageGen] Using static fallback for carpentry style: ${matchedCarpentryStyle}`);
    } else {
      const translatedMainSubject = effectiveMainSubject ? extractSubjectFromTitle(effectiveMainSubject) : null;
      const mainSubjectTranslated = translatedMainSubject && translatedMainSubject !== effectiveMainSubject
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

    const articleHeadingHints = extractMarkdownHeadings(articleContext?.body, 6);

    const isPaintingCategory = categoryLower.includes('pintura') || categoryLower.includes('dicas-de-pintura');
    if (isPaintingCategory) {
      const detectedTechnique = detectPaintingTechniqueFromText(combinedContext);
      if (detectedTechnique && (!subject || isGenericPaintingSubject(subject))) {
        subject = detectedTechnique;
      }
    }

    const archDetails = matchedArchStyle ? architectureStylePrompts[matchedArchStyle].details : '';
    // For carpentry: use static details as enrichment, but article data drives the main subject
    const carpentryDetails = matchedCarpentryStyle ? carpentryStylePrompts[matchedCarpentryStyle].details : '';

    console.log(`[ImageGen] Category: "${effectiveCategory}", Subject: "${subject.substring(0, 80)}...", isArch: ${isArchitectureSubject}, isCarpentry: ${isCarpentrySubject}, isWoodTypes: ${isWoodTypesTopic}, articleSpecific: ${hasArticleSpecificData}`);
    
    const exteriorSetting = 'stunning building exterior facade, street view, clear sky, professional architectural photography, natural daylight';
    const interiorSetting = 'beautiful home interior, professional photography, warm lighting';
    const carpentrySetting = 'American residential construction site, suburban neighborhood, natural daylight, professional construction photography';
    const woodTypesSetting = 'professional lumberyard and woodworking studio, organized wood species samples, natural daylight, editorial materials photography';

    const resolvedVisualContext = effectiveVisualContext || '';

    // Detect garden/outdoor categories
    const gardenCategories = ['jardim', 'decoracao-jardim', 'cuidados-plantacao', 'jardim-vertical', 'suculentas-cactos', 'horta-de-ervas', 'flores-ornamentais', 'paisagismo', 'hidroponia', 'jardim-sustentavel', 'nomes-cuidados-plantas-flores', 'hortas-ervas-cuidados', 'piscina'];
    const isGardenCategory = gardenCategories.some(g => categoryLower.includes(g) || categoryNormalized.includes(g));
    const gardenSetting = 'beautiful outdoor garden, natural sunlight, lush green plants, professional garden photography, vibrant colors';

    let setting: string;
    if (isArchitectureSubject) {
      if (resolvedVisualContext && !resolvedVisualContext.toLowerCase().includes('interior')) {
        setting = resolvedVisualContext;
      } else {
        setting = exteriorSetting;
      }
    } else if (isCarpentrySubject) {
      if (isWoodTypesTopic) {
        const canUseContext = resolvedVisualContext && !isConstructionFocusedText(resolvedVisualContext);
        setting = canUseContext ? resolvedVisualContext : woodTypesSetting;
      } else {
        setting = resolvedVisualContext || carpentrySetting;
      }
    } else if (isGardenCategory) {
      setting = resolvedVisualContext || gardenSetting;
    } else {
      setting = resolvedVisualContext || interiorSetting;
    }
    const antiTextClause = "no text, no words, no letters, no typography, no watermarks, no logos";

    let prompt: string;
    const photoStyle = isArchitectureSubject
      ? 'Professional exterior architectural photography, building facade, outdoor perspective'
      : isCarpentrySubject
        ? (isWoodTypesTopic
          ? 'Professional material and woodworking photography, wood grain texture focus, editorial close-up'
          : 'Professional construction photography, American residential building, realistic detailed')
        : 'Professional interior photography';
    
    if (type === 'cover') {
      if (isArchitectureSubject) {
        prompt = `${subject}, ${archDetails}, stunning exterior facade photograph for architecture magazine. Environment: ${setting}. Wide 16:9 cinematic composition, building front view, outdoor perspective, ultra high resolution, sharp focus. ${antiTextClause}.`;
      } else if (isCarpentrySubject) {
        const carpentryCoverHint = articleHeadingHints[0] || articleContext?.excerpt || title || '';
        const coverHintSegment = carpentryCoverHint ? `article context: ${carpentryCoverHint}, ` : '';
        if (isWoodTypesTopic) {
          prompt = `${subject}, ${carpentryDetails}, ${coverHintSegment}premium material photography for wood selection editorial. Environment: ${setting}. Wide 16:9 cinematic composition, ultra high resolution, macro texture accents, no house framing skeleton, sharp focus. ${antiTextClause}.`;
        } else {
          prompt = `${subject}, ${carpentryDetails}, ${coverHintSegment}professional photograph for American carpentry article. Environment: ${setting}. Wide 16:9 cinematic composition, ultra high resolution, sharp focus, realistic technical scene. ${antiTextClause}.`;
        }
      } else {
        prompt = `${subject}, professional hero photograph for home design magazine. Environment: ${setting}. Wide 16:9 cinematic composition, ultra high resolution, sharp focus. ${antiTextClause}.`;
      }
    } else {
      let galleryDetail = customPrompt || 'detailed professional photography';
      galleryDetail = translatePromptTerms(galleryDetail);

      const paintingTechniqueDetail = isPaintingCategory ? detectPaintingTechniqueFromText(`${galleryDetail} | ${combinedContext}`) : null;
      if (paintingTechniqueDetail && isGenericPaintingSubject(subject)) {
        subject = paintingTechniqueDetail;
      }
      if (isArchitectureSubject) {
        const cleanedDetail = galleryDetail
          .replace(/\binterior\b/gi, 'exterior')
          .replace(/\bindoor\b/gi, 'outdoor')
          .replace(/\broom\b/gi, 'facade')
          .replace(/\bfurniture\b/gi, 'structural details')
          .replace(/\bliving room\b/gi, 'building exterior')
          .replace(/\bbedroom\b/gi, 'building facade')
          .replace(/\bkitchen\b/gi, 'entrance');
        prompt = `${subject}, ${archDetails}, ${cleanedDetail}, outdoor architectural perspective. Setting: ${setting}. ${photoStyle}, sharp focus. ${antiTextClause}.`;
      } else if (isCarpentrySubject) {
        const carpentryDetail = resolveCarpentryGalleryDetail({
          style: matchedCarpentryStyle,
          customPrompt: galleryDetail,
          imageIndex,
          articleTitle: articleContext?.title || title,
          articleExcerpt: articleContext?.excerpt || '',
          articleBody: articleContext?.body || '',
          isWoodTypesTopic,
        });

        if (isWoodTypesTopic) {
          const sanitizedGallery = sanitizeWoodTypesPrompt(carpentryDetail) || 'comparative close-up of different wood species, grain textures, and board finishes';
          prompt = `${subject}, ${carpentryDetails}, ${sanitizedGallery}. Setting: ${setting}. ${photoStyle}, species differentiation focus, no house framing skeleton, sharp focus. ${antiTextClause}.`;
        } else {
          prompt = `${subject}, ${carpentryDetails}, ${carpentryDetail}. Setting: ${setting}. ${photoStyle}, sharp focus, realistic technical carpentry scene. ${antiTextClause}.`;
        }
      } else {
        if (customPrompt && customPrompt.trim().length > 20) {
          const translatedPrompt = translatePromptTerms(customPrompt);
          prompt = `${translatedPrompt}. Setting: ${setting}. ${photoStyle}, sharp focus. ${antiTextClause}.`;
          console.log(`[ImageGen] Using article-specific gallery prompt (${prompt.substring(0, 80)}...)`);
        } else {
          prompt = `${subject}, ${galleryDetail}. Setting: ${setting}. ${photoStyle}, sharp focus. ${antiTextClause}.`;
        }
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
