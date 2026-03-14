import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const categories = [
  // Design Interno
  { name: 'Sala', slug: 'sala' },
  { name: 'Sala de Jantar', slug: 'sala-de-jantar' },
  { name: 'Lareira', slug: 'lareira' },
  { name: 'Área Gourmet', slug: 'area-gourmet' },
  { name: 'Quarto', slug: 'quarto' },
  { name: 'Banheiro', slug: 'banheiro' },
  { name: 'Escritório', slug: 'escritorio' },
  { name: 'Cozinha', slug: 'cozinha' },
  { name: 'Varanda', slug: 'varanda' },
  { name: 'Área de Serviço', slug: 'area-de-servico' },
  { name: 'Piscina', slug: 'piscina' },
  { name: 'Dicas de Pintura', slug: 'dicas-de-pintura' },
  // Jardim
  { name: 'Jardim', slug: 'jardim' },
  { name: 'Decoração de Jardim', slug: 'decoracao-jardim' },
  { name: 'Cuidados com Plantação', slug: 'cuidados-plantacao' },
  { name: 'Jardim Vertical', slug: 'jardim-vertical' },
  { name: 'Suculentas e Cactos', slug: 'suculentas-cactos' },
  { name: 'Horta de Ervas', slug: 'horta-de-ervas' },
  { name: 'Flores Ornamentais', slug: 'flores-ornamentais' },
  { name: 'Paisagismo', slug: 'paisagismo' },
  { name: 'Hidroponia', slug: 'hidroponia' },
  { name: 'Jardim Sustentável', slug: 'jardim-sustentavel' },
  { name: 'Decoração de Halloween', slug: 'decoracao-halloween' },
  { name: 'Nomes e Cuidados Plantas e Flores', slug: 'nomes-cuidados-plantas-flores' },
  { name: 'Hortas, Ervas e Cuidados', slug: 'hortas-ervas-cuidados' },
  // Arquitetura
  { name: 'Colonial', slug: 'colonial' },
  { name: 'Industrial', slug: 'industrial' },
  { name: 'Moderno', slug: 'moderno' },
  { name: 'Neolítico', slug: 'neolitico' },
  { name: 'Europeu', slug: 'europeu' },
  { name: 'Nórdico', slug: 'nordico' },
  { name: 'Neo Clássico', slug: 'neo-classico' },
  // Carpintaria & Construção em Madeira
  { name: 'Carpintaria - História', slug: 'carpintaria-historia' },
  { name: 'Carpintaria - Wood Framing', slug: 'carpintaria-wood-framing' },
  { name: 'Carpintaria - Tipos de Madeira', slug: 'carpintaria-tipos-madeira' },
  { name: 'Carpintaria - Isolamento Térmico', slug: 'carpintaria-isolamento' },
  { name: 'Carpintaria - Aquecimento & Piso Aquecido', slug: 'carpintaria-aquecimento' },
  { name: 'Carpintaria - Manutenção & Conservação', slug: 'carpintaria-manutencao' },
  { name: 'Carpintaria - Eficiência Energética', slug: 'carpintaria-eficiencia' },
  { name: 'Carpintaria - Técnicas Tradicionais vs Modernas', slug: 'carpintaria-tecnicas' },
];

const FLOWER_NAMES_CATEGORY_SLUG = 'nomes-cuidados-plantas-flores';

// No static pool - AI dynamically chooses from unlimited botanical diversity
// Anti-duplication is enforced via database blacklist only

function normalizePlantName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPlantNameFromTitle(title: string): string {
  const raw = (title || '').split(':')[0]?.split('—')[0]?.split('-')[0] || title;
  return normalizePlantName(raw);
}

function namesLikelySame(a: string, b: string): boolean {
  const na = normalizePlantName(a);
  const nb = normalizePlantName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // Only match if full multi-word names match, NOT just first word
  // This allows "Orquídea Phalaenopsis" and "Orquídea Dendrobium" to be DIFFERENT
  const aWords = na.split(' ').filter(w => w.length >= 3);
  const bWords = nb.split(' ').filter(w => w.length >= 3);
  // If both have subspecies (2+ words), require full match or full inclusion
  if (aWords.length >= 2 && bWords.length >= 2) {
    return na.includes(nb) || nb.includes(na);
  }
  // If one is a single generic word (e.g. "lavanda"), match if the other starts with it
  if (aWords.length === 1 && bWords.length >= 1) {
    return bWords[0] === aWords[0];
  }
  if (bWords.length === 1 && aWords.length >= 1) {
    return aWords[0] === bWords[0];
  }
  return false;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min`;
}

// Pre-validated domains that are known to be alive — skip HEAD request
const KNOWN_GOOD_DOMAINS = new Set([
  'bhg.com', 'thespruce.com', 'hgtv.com', 'marthastewart.com', 'housebeautiful.com',
  'realsimple.com', 'architecturaldigest.com', 'dwell.com', 'archdaily.com', 'dezeen.com',
  'gardeningknowhow.com', 'almanac.com', 'finegardening.com', 'gardeners.com', 'epicgardening.com',
  'extension.umn.edu', 'thisoldhouse.com', 'familyhandyman.com', 'bobvila.com', 'lowes.com',
  'homedepot.com', 'finehomebuilding.com', 'finewoodworking.com', 'popularwoodworking.com',
  'woodmagazine.com', 'jlconline.com',
]);

function getDomainFromUrl(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
}

async function validateUrl(url: string): Promise<boolean> {
  try {
    if (!url || !url.startsWith('http')) return false;

    // Skip HEAD request for known-good domains
    const domain = getDomainFromUrl(url);
    if (domain && KNOWN_GOOD_DOMAINS.has(domain)) return true;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced from 5s to 3s
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LinkValidator/1.0)' },
      redirect: 'follow',
    });
    
    clearTimeout(timeoutId);
    return response.status >= 200 && response.status < 400;
  } catch (error) {
    console.log(`URL validation failed for ${url}:`, error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

// Pool of diverse US-focused authority sites — randomly pick 3 per article for variety
const US_AUTHORITY_LINKS_POOL = [
  // Home & Garden
  { text: "Better Homes & Gardens", url: "https://www.bhg.com/" },
  { text: "The Spruce", url: "https://www.thespruce.com/" },
  { text: "HGTV", url: "https://www.hgtv.com/" },
  { text: "Martha Stewart Home", url: "https://www.marthastewart.com/home" },
  { text: "House Beautiful", url: "https://www.housebeautiful.com/" },
  { text: "Real Simple Home", url: "https://www.realsimple.com/home-organizing" },
  // Architecture & Design
  { text: "Architectural Digest", url: "https://www.architecturaldigest.com/" },
  { text: "Dwell Magazine", url: "https://www.dwell.com/" },
  { text: "ArchDaily", url: "https://www.archdaily.com/" },
  { text: "Dezeen", url: "https://www.dezeen.com/" },
  // Gardening
  { text: "Gardening Know How", url: "https://www.gardeningknowhow.com/" },
  { text: "The Old Farmer's Almanac", url: "https://www.almanac.com/gardening" },
  { text: "Fine Gardening", url: "https://www.finegardening.com/" },
  { text: "Gardener's Supply Company", url: "https://www.gardeners.com/" },
  { text: "Epic Gardening", url: "https://www.epicgardening.com/" },
  { text: "University Extension - Gardening", url: "https://extension.umn.edu/yard-and-garden" },
  // DIY & Improvement
  { text: "This Old House", url: "https://www.thisoldhouse.com/" },
  { text: "Family Handyman", url: "https://www.familyhandyman.com/" },
  { text: "Bob Vila", url: "https://www.bobvila.com/" },
  { text: "Lowe's Home Improvement", url: "https://www.lowes.com/" },
  { text: "The Home Depot", url: "https://www.homedepot.com/" },
  // Carpentry & Wood Construction
  { text: "Fine Homebuilding", url: "https://www.finehomebuilding.com/" },
  { text: "Fine Woodworking", url: "https://www.finewoodworking.com/" },
  { text: "Popular Woodworking", url: "https://www.popularwoodworking.com/" },
  { text: "Wood Magazine", url: "https://www.woodmagazine.com/" },
  { text: "Journal of Light Construction", url: "https://www.jlconline.com/" },
];

// Select random subset from pool for diversity
function getRandomFallbackLinks(count: number = 5): Array<{ text: string; url: string }> {
  const shuffled = [...US_AUTHORITY_LINKS_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function validateExternalLinks(
  links: Array<{ text: string; url: string }>,
  minRequired: number = 5
): Promise<Array<{ text: string; url: string }>> {
  console.log(`Validating ${links?.length || 0} external links (minimum required: ${minRequired})...`);
  
  let validLinks: Array<{ text: string; url: string }> = [];
  
  // First: validate AI-generated links (these should be topic-specific and diverse)
  if (links && links.length > 0) {
    const validationResults = await Promise.all(
      links.map(async (link) => {
        const isValid = await validateUrl(link.url);
        console.log(`AI link "${link.text}" (${link.url}): ${isValid ? 'VALID' : 'INVALID'}`);
        return { link, isValid };
      })
    );
    
    // Deduplicate by domain to ensure diversity
    const usedDomains = new Set<string>();
    for (const result of validationResults) {
      if (!result.isValid) continue;
      try {
        const domain = new URL(result.link.url).hostname.replace('www.', '');
        if (!usedDomains.has(domain)) {
          validLinks.push(result.link);
          usedDomains.add(domain);
        }
      } catch {
        validLinks.push(result.link);
      }
    }
  }
  
  console.log(`Valid AI links: ${validLinks.length}`);
  
  // Second: fill gaps with random fallback links from US authority pool
  if (validLinks.length < minRequired) {
    console.log(`Adding fallback links to reach minimum of ${minRequired}...`);
    
    const existingDomains = new Set(
      validLinks.map(l => { try { return new URL(l.url).hostname.replace('www.', ''); } catch { return l.url; } })
    );
    
    const fallbacks = getRandomFallbackLinks(10);
    for (const fallback of fallbacks) {
      if (validLinks.length >= minRequired) break;
      
      try {
        const domain = getDomainFromUrl(fallback.url);
        if (!existingDomains.has(domain)) {
          // Fallback links from our pool are pre-validated — skip HEAD request
          validLinks.push(fallback);
          existingDomains.add(domain);
          console.log(`Added fallback link: ${fallback.text}`);
        }
      } catch {
        continue;
      }
    }
  }
  
  console.log(`Final valid links count: ${validLinks.length}`);
  return validLinks;
}

interface ImageMetadata {
  mainSubject: string;
  visualContext: string;
  galleryPrompts: string[];
}

function validateGalleryPrompts(
  galleryPrompts: unknown,
  mainSubject: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(galleryPrompts)) {
    errors.push('galleryPrompts must be an array');
    return { valid: false, errors };
  }

  if (galleryPrompts.length !== 6) {
    errors.push(`galleryPrompts must have exactly 6 items, got ${galleryPrompts.length}`);
  }

  galleryPrompts.forEach((prompt, index) => {
    if (typeof prompt !== 'string') {
      errors.push(`galleryPrompts[${index}] is not a string`);
      return;
    }

    if (!prompt || prompt.trim() === '') {
      errors.push(`galleryPrompts[${index}] is empty`);
      return;
    }

    const wordCount = prompt.split(/\s+/).length;
    if (wordCount < 15) {
      errors.push(`galleryPrompts[${index}] has only ${wordCount} words (min 15)`);
    }

    const normalizedPrompt = prompt.toLowerCase().trim();
    const normalizedSubject = mainSubject.toLowerCase().trim();
    if (!normalizedPrompt.startsWith(normalizedSubject.split(' ')[0])) {
      errors.push(`galleryPrompts[${index}] doesn't start with mainSubject`);
    }
  });

  return { valid: errors.length === 0, errors };
}

const GENERIC_CARPENTRY_MARKERS = [
  'wood frame house construction',
  'skeletal structure',
  'roof trusses',
  'wall studs',
  'building materials organized on job site',
  'suburban lot',
  'under construction',
];

const CARPENTRY_CONTEXTUAL_FALLBACKS: Record<string, { subject: string; context: string; angles: string[] }> = {
  'carpintaria-historia': {
    subject: 'historical American carpentry timeline with handcrafted timber details, joinery marks, and evolution of techniques',
    context: 'heritage carpentry workshop with archival tools, restored timber pieces, documentary style lighting',
    angles: [
      'wide editorial view of historical woodworking benches and old hand tools organized by era',
      'close-up of traditional mortise and tenon joinery with visible hand-tool marks and patina',
      'side perspective comparing antique timber framing details with modern reference samples',
      'macro shot of aged wood grain, nail heads, and restoration notes from historical structures',
      'overhead table layout with timeline cards showing milestones of American carpentry evolution',
      'final composed storytelling scene combining vintage plans, measuring tools, and timber samples',
    ],
  },
  'carpintaria-wood-framing': {
    subject: 'American wood framing system with structural lumber, engineered connectors, and platform framing workflow',
    context: 'active residential framing site with code-compliant sequencing, daylight, and professional construction photography',
    angles: [
      'wide-angle view of complete platform framing sequence with aligned stud walls and floor deck',
      'detail shot of wall framing junctions with metal connectors, nailing pattern, and bracing',
      'interior perspective showing framing grid coordination for openings and service routes',
      'low angle photograph of roof framing geometry and load path continuity details',
      'side view highlighting sheathing installation and air barrier preparation on framed walls',
      'context scene showing framing crew workflow, lumber staging, and quality inspection checklist',
    ],
  },
  'carpintaria-tipos-madeira': {
    subject: 'comparative wood species board set with Douglas fir, Southern pine, cedar, grain texture, and lumber grading',
    context: 'professional lumberyard and woodworking materials studio with organized samples and neutral editorial lighting',
    angles: [
      'wide comparison table with multiple wood species boards arranged by tone, density, and intended use',
      'macro close-up of grain texture, knots, and growth rings highlighting species differences',
      'cross-section lineup of boards showing color variation, density, and cut orientation details',
      'finish test panel with raw wood, sealer, and varnish outcomes on distinct species',
      'technical identification scene with grade stamps, labels, and moisture readings on lumber pieces',
      'editorial composition with hand tools and categorized wood samples prepared for material selection',
    ],
  },
  'carpintaria-isolamento': {
    subject: 'thermal and acoustic insulation layers in American wood assemblies with cavity detailing and air sealing focus',
    context: 'wood frame wall mockup lab with insulation materials, vapor control layers, and diagnostic tools',
    angles: [
      'wide mockup view showing wall assembly layers from exterior sheathing to interior finish line',
      'detail close-up of insulation fit quality between studs with no compression gaps',
      'side cutaway perspective highlighting vapor control membrane and sealing continuity',
      'macro shot of acoustic insulation interfaces around service penetrations and framing edges',
      'testing scene with thermal camera and blower-door style diagnostic setup on wall sample',
      'final assembled section comparing insulation options and performance notes for climate zones',
    ],
  },
  'carpintaria-aquecimento': {
    subject: 'heating systems integrated with wood construction including radiant floor loops and forced-air distribution details',
    context: 'technical installation environment with wood subfloor sections, HVAC components, and commissioning tools',
    angles: [
      'wide view of radiant floor tubing layout over prepared wood subfloor before finish layer',
      'close-up of manifold connections and loop spacing standards for balanced floor heating',
      'cutaway perspective showing floor build-up layers and thermal transfer strategy in wood assembly',
      'detail image of duct routing and insulation around wood framing without thermal bridging',
      'control scene with thermostats, zoning panel, and temperature monitoring setup',
      'integrated system composition comparing radiant floor and forced-air solutions in one technical frame',
    ],
  },
  'carpintaria-manutencao': {
    subject: 'wood maintenance workflow for structural and finish durability with inspection, repair, and protective treatment stages',
    context: 'residential carpentry maintenance setup with restored wood components, tools, and product application sequence',
    angles: [
      'wide maintenance bench with wood parts separated by condition and intervention priority',
      'close-up of moisture-related deterioration signs, cracks, and biological damage indicators',
      'detail shot of sanding and surface preparation before protective coating application',
      'treatment scene showing preservative and sealer layers applied with correct technique',
      'repair composition with replacement inserts and reinforcement details on damaged wood elements',
      'final before-and-after layout documenting restored pieces and maintenance schedule checklist',
    ],
  },
  'carpintaria-eficiencia': {
    subject: 'energy-efficient wood construction envelope with airtight detailing, thermal continuity, and performance verification',
    context: 'high-performance building mockup with wood framing, insulation strategy, and energy diagnostic instruments',
    angles: [
      'wide view of high-performance wall section with complete envelope continuity references',
      'close-up of air-sealing transitions at critical joints between framing and sheathing',
      'detail perspective of window perimeter insulation and thermal bridge mitigation in wood wall',
      'diagnostic scene with thermal imaging map highlighting heat-loss reduction points',
      'mechanical integration shot showing controlled ventilation and insulated distribution paths',
      'final comparative board with efficiency metrics, assembly notes, and climate-specific recommendations',
    ],
  },
  'carpintaria-tecnicas': {
    subject: 'comparative carpentry techniques showing traditional joinery craftsmanship and modern framing execution standards',
    context: 'split woodworking studio and framing workshop environment, documenting tools, methods, and construction outcomes',
    angles: [
      'wide side-by-side scene of traditional joinery station and modern framing workstation',
      'close-up of hand-cut joinery precision alongside pneumatic fastening details',
      'detail shot comparing tool marks, tolerances, and assembly speed indicators',
      'process frame showing layout lines, measurement references, and sequencing logic',
      'low angle composition capturing structural behavior in traditional versus modern assemblies',
      'editorial finish combining both methods with decision notes for practical project scenarios',
    ],
  },
};

function extractMarkdownHeadings(markdown?: string, max: number = 10): string[] {
  if (!markdown) return [];
  const matches = [...markdown.matchAll(/^##+\s+(.+)$/gm)]
    .map((m) => (m[1] || '').replace(/[*_`]/g, '').trim())
    .filter((line) => line.length >= 6)
    .slice(0, max);
  return matches;
}

function isGenericCarpentryPromptPack(prompts: string[]): boolean {
  const joined = (prompts || []).join(' ').toLowerCase();
  const hits = GENERIC_CARPENTRY_MARKERS.filter((marker) => joined.includes(marker)).length;
  return hits >= 2;
}

function getCarpentryFallbackPack(categorySlug?: string) {
  return CARPENTRY_CONTEXTUAL_FALLBACKS[categorySlug || ''] || CARPENTRY_CONTEXTUAL_FALLBACKS['carpintaria-tecnicas'];
}

function generateCarpentryContextualFallbackPrompts(
  mainSubject: string,
  visualContext: string,
  options?: { categorySlug?: string; content?: string; topic?: string }
): string[] {
  const pack = getCarpentryFallbackPack(options?.categorySlug);
  const headingHints = extractMarkdownHeadings(options?.content, 6);
  const topicHint = (options?.topic || '').replace(/[:\-–—]/g, ' ').trim();
  const resolvedSubject = mainSubject?.trim().length >= 12 ? mainSubject : pack.subject;
  const resolvedContext = visualContext?.trim().length >= 12 ? visualContext : pack.context;

  return pack.angles.map((angle, index) => {
    const headingHint = headingHints[index] || headingHints[0] || topicHint;
    const headingSegment = headingHint ? `article focus: ${headingHint}, ` : '';
    return `${resolvedSubject}, ${headingSegment}${angle}, environment: ${resolvedContext}, natural daylight, professional editorial photography, ultra realistic, sharp focus, no text, no words, no watermarks, no logos`;
  });
}

function generateFallbackPrompts(
  mainSubject: string,
  visualContext: string,
  options?: { categorySlug?: string; content?: string; topic?: string }
): string[] {
  const isCarpentryCategory = (options?.categorySlug || '').startsWith('carpintaria');
  const carpentryKeywords = ['wood frame', 'wood framing', 'timber', 'carpentry', 'lumber', 'insulation', 'radiant floor', 'heating', 'construction'];
  const isCarpentry = isCarpentryCategory || carpentryKeywords.some(k => mainSubject.toLowerCase().includes(k));

  if (isCarpentry) {
    return generateCarpentryContextualFallbackPrompts(mainSubject, visualContext, options);
  }

  const cameraAngles = [
    { angle: 'wide-angle front view establishing shot', composition: 'hero composition showing entire space, 16:9 cinematic framing' },
    { angle: 'medium shot from left side', composition: 'showing furniture arrangement and wall details' },
    { angle: 'close-up macro shot', composition: 'focusing on textures, materials and decorative details' },
    { angle: 'shot from right side', composition: 'alternative perspective revealing hidden corner elements' },
    { angle: 'low angle dramatic shot from floor level', composition: 'looking upward to emphasize height and ceiling' },
    { angle: 'high angle bird eye overview', composition: 'showing full spatial layout and floor design' }
  ];

  return cameraAngles.map(({ angle, composition }) => 
    `${mainSubject} in ${visualContext}, ${angle}, ${composition}, same room same decor same lighting, consistent interior design, natural daylight, ultra realistic, professional architectural photography, sharp focus, no text, no words, no watermarks, no logos`
  );
}

function validateAndSanitizeImageData(
  data: Partial<ImageMetadata>,
  options?: { categorySlug?: string; content?: string; topic?: string }
): ImageMetadata {
  const isCarpentryCategory = (options?.categorySlug || '').startsWith('carpintaria');
  const carpentryPack = getCarpentryFallbackPack(options?.categorySlug);

  let mainSubject = data.mainSubject || '';
  let visualContext = data.visualContext || '';
  let galleryPrompts = data.galleryPrompts || [];

  if (!mainSubject || mainSubject.trim().length < 5) {
    mainSubject = isCarpentryCategory ? carpentryPack.subject : 'home design element';
    console.warn('[ImageValidation] Invalid mainSubject, using fallback');
  }

  if (!visualContext || visualContext.trim().length < 5) {
    const archKeywords = ['facade', 'exterior', 'colonial', 'industrial', 'modern building', 'neolithic', 'european', 'nordic', 'neoclassical', 'architecture'];
    const carpentryKeywords = ['wood frame', 'wood framing', 'timber', 'carpentry', 'lumber', 'insulation', 'radiant floor', 'heating'];
    const isArch = archKeywords.some(k => mainSubject.toLowerCase().includes(k));
    const isCarpentry = isCarpentryCategory || carpentryKeywords.some(k => mainSubject.toLowerCase().includes(k));
    if (isCarpentry) {
      visualContext = carpentryPack.context;
    } else if (isArch) {
      visualContext = 'building exterior facade, street view, clear sky, natural daylight';
    } else {
      visualContext = 'modern home interior with natural lighting';
    }
    console.warn('[ImageValidation] Invalid visualContext, using fallback:', visualContext);
  }

  if (isCarpentryCategory && isGenericCarpentryPromptPack(galleryPrompts)) {
    console.warn('[ImageValidation] Generic carpentry gallery prompts detected, rebuilding from article context');
    galleryPrompts = generateCarpentryContextualFallbackPrompts(mainSubject, visualContext, options);
  }

  const validation = validateGalleryPrompts(galleryPrompts, mainSubject);
  
  if (!validation.valid) {
    console.warn('[ImageValidation] Invalid galleryPrompts:', validation.errors);
    console.warn('[ImageValidation] Generating fallback prompts...');
    galleryPrompts = generateFallbackPrompts(mainSubject, visualContext, options);
  }

  while (galleryPrompts.length < 6) {
    const idx = galleryPrompts.length;
    galleryPrompts.push(
      `${mainSubject}, detail shot ${idx + 1}, ${visualContext}, natural lighting, ultra realistic, professional photography, no text, no words, no watermarks`
    );
  }
  galleryPrompts = galleryPrompts.slice(0, 6);

  return { mainSubject, visualContext, galleryPrompts };
}

function buildCarpentryHistoricalExpansion(topic: string): string {
  const timelineMilestones = [
    {
      period: '1607-1775 | Fundações Coloniais',
      detail: 'Os primeiros colonos em Jamestown e na Nova Inglaterra adaptaram as tradições inglesas de carpintaria às florestas locais, usando vigas lavradas à mão, juntas de encaixe (mortise-and-tenon) e celeiros de estrutura pesada; esse período estabeleceu a carpintaria como habilidade de sobrevivência e ofício respeitado nas colônias.'
    },
    {
      period: '1776-1820 | Artesanato da República Inicial',
      detail: 'Após a independência, guildas regionais de carpintaria e programas de aprendizagem se expandiram, e construtores padronizaram as dimensões de estruturação para casas, tavernas e edifícios cívicos; os carpinteiros equilibravam velocidade com durabilidade enquanto respondiam ao rápido crescimento urbano e às novas demandas de infraestrutura.'
    },
    {
      period: '1820-1860 | A Revolução do Balloon Framing',
      detail: 'Serrarias industriais e pregos fabricados por máquina tornaram o balloon framing viável, substituindo muitos sistemas de madeira pesada; montantes longos indo da soleira ao telhado aceleraram a construção, reduziram custos de mão de obra e transformaram a produção habitacional nas cidades em expansão do Meio-Oeste.'
    },
    {
      period: '1860-1910 | Ferrovias, Casas por Catálogo e Início dos Códigos',
      detail: 'As redes ferroviárias transportaram madeira para todo o país e permitiram kits de casas por correio, enquanto as cidades introduziram as primeiras regulamentações contra incêndio e estruturais; os carpinteiros começaram a seguir uma cultura de código emergente, combinando técnicas práticas de campo com requisitos de engenharia gradualmente formalizados.'
    },
    {
      period: '1910-1945 | Platform Framing e Preparação Suburbana',
      detail: 'O platform framing se tornou dominante porque cada andar criava um deck de trabalho mais seguro, reduzia a propagação de incêndios nas cavidades das paredes e simplificava o sequenciamento; construtores adotaram métodos repetíveis que posteriormente apoiaram o desenvolvimento suburbano em larga escala após a Segunda Guerra Mundial.'
    },
    {
      period: '1945-1980 | Boom Suburbano e Integração Mecânica',
      detail: 'A demanda pós-guerra impulsionou projetos habitacionais em massa onde a carpintaria se coordenava com sistemas elétricos, hidráulicos e de climatização (HVAC); montagens padronizadas de 2x4 e 2x6, revestimento de compensado e práticas de isolamento se tornaram rotina nos fluxos de trabalho da construção residencial americana.'
    },
    {
      period: '1980-2005 | Códigos Energéticos e Construção de Performance',
      detail: 'O aumento dos custos de energia e regulamentações mais rigorosas impulsionaram melhor vedação de ar, controle de vapor e detalhamento de isolamento; os carpinteiros colaboraram cada vez mais com inspetores e projetistas para atender metas térmicas, padrões de gerenciamento de umidade e requisitos de conforto dos ocupantes.'
    },
    {
      period: '2005-Hoje | Alta Performance e Construção Híbrida em Madeira',
      detail: 'A carpintaria moderna combina fixadores avançados, produtos de madeira engenheirada, ferramentas digitais de layout e detalhamento resiliente contra umidade e vento; construtores agora integram testes de desempenho, metas de sustentabilidade e conformidade com códigos desde o projeto até a inspeção final.'
    },
  ];

  const timelineSection = timelineMilestones
    .map((item, index) => `### ${index + 1}. ${item.period}\n${item.detail}`)
    .join('\n\n');

  return `\n\n## Linha do Tempo Histórica da Carpintaria Americana (Mergulho Profundo)\n\nQuando eu pesquisei ${topic} a fundo, percebi que a carpintaria americana não evoluiu em linha reta. Ela cresceu através de desafios climáticos, ondas migratórias, inovação industrial e ciclos de regulamentação que forçaram os construtores a melhorar estrutura, segurança e desempenho térmico. Essa linha do tempo ajuda a contextualizar por que a construção residencial em wood frame nos Estados Unidos é tão sistematizada e eficiente hoje.\n\n${timelineSection}\n\n## Por Que Esse Contexto Histórico Ainda Importa nos Canteiros de Obra\n\nEntender essa história muda como interpretamos as melhores práticas atuais. O balloon framing explica os retrofits de bloqueio contra incêndio em casas antigas; o platform framing explica por que as equipes de hoje sequenciam pisos e paredes de forma diferente; e a pressão regulatória pós-1980 explica por que isolamento, vedação de ar e controle de umidade são tratados como prioridades estruturais e não como melhorias opcionais.\n\nQuando eu comparo os métodos americanos com a tradição de alvenaria que conhecemos no Brasil, vejo que a carpintaria americana evoluiu em torno de logística modular e fluxos de trabalho repetíveis. É por isso que os padrões de madeira dimensional, cronogramas de fixação e pontos de inspeção são tão explícitos. O objetivo não é apenas velocidade, mas desempenho previsível sob cargas climáticas, variações sazonais de temperatura e ciclos de manutenção de longo prazo.\n\n## Legado Técnico Que Conecta Passado e Presente\n\nA mudança histórica da carpintaria artesanal para a carpintaria regulamentada por código criou uma cultura onde os carpinteiros precisam entender caminhos de carga, movimento de umidade e métricas energéticas. Hoje, conceitos como continuidade de valor-R, hermeticidade, hierarquia de impermeabilização e coordenação mecânica são descendentes diretos de lições aprendidas ao longo de séculos de erros e inovações no campo.\n\nPara qualquer pessoa que estude carpintaria americana seriamente, essa perspectiva é essencial: cada montagem de parede moderna carrega DNA histórico. Os padrões de estruturação, normas de isolamento, regras de fixação e checklists de detalhamento que usamos agora foram construídos camada por camada através de décadas de experimentação, falhas e refinamentos. Conhecer essa linhagem nos ajuda a projetar melhor, construir com mais segurança e manter estruturas de madeira com muito mais confiança.\n\n## Materiais e Técnicas Fundamentais da Carpintaria Americana Moderna\n\nUma das coisas que mais me impressionou ao estudar a construção americana foi a padronização obsessiva dos materiais. A madeira dimensional — aqueles famosos 2x4, 2x6, 2x8, 2x10 e 2x12 — não são apenas peças de madeira cortadas em serraria. Elas passam por um processo rigoroso de secagem em estufa (kiln-dried) que reduz o teor de umidade para entre 15% e 19%, garantindo estabilidade dimensional e resistência a empenamento.\n\nNo Brasil, quando falamos em "madeira de construção", geralmente pensamos em madeira bruta, muitas vezes com umidade variável e sem tratamento padronizado. Nos Estados Unidos, cada peça de lumber recebe uma classificação de grau (grade stamp) que indica a espécie, o teor de umidade, a resistência e o órgão certificador. Isso elimina adivinhações no canteiro de obras e permite que engenheiros calculem cargas com precisão milimétrica.\n\nOs tipos mais comuns de madeira usados na carpintaria residencial americana incluem o Southern Yellow Pine (SYP), o Douglas Fir, o Spruce-Pine-Fir (SPF) e o Hem-Fir. Cada espécie tem propriedades mecânicas específicas que determinam onde pode ser usada — vigas principais, montantes de parede, caibros de telhado ou soleiras de fundação. O Southern Yellow Pine, por exemplo, é a escolha preferida para estruturas tratadas com preservativos contra cupins e umidade do solo, especialmente em estados do sudeste como Geórgia, Flórida e Carolina do Sul.\n\nAlém da madeira sólida dimensional, a carpintaria moderna americana incorpora produtos de madeira engenheirada (engineered wood products) que revolucionaram as possibilidades estruturais. As vigas I (I-joists) combinam flanges de madeira sólida ou LVL com uma alma de OSB, criando elementos estruturais leves mas incrivelmente resistentes que podem vencer vãos de até 9 metros sem apoio intermediário. O LVL (Laminated Veneer Lumber) é fabricado colando camadas finas de madeira sob alta pressão, resultando em vigas que não racham, não empenam e mantêm dimensões consistentes ao longo de décadas. O PSL (Parallel Strand Lumber) vai ainda além, oferecendo capacidade de carga superior para aplicações como vigas de garagem, lintéis sobre grandes aberturas e colunas estruturais.\n\n## Ferramentas e Equipamentos do Carpinteiro Americano\n\nO kit de ferramentas de um carpinteiro profissional nos Estados Unidos reflete a eficiência e a velocidade que o mercado exige. A pregadeira pneumática (framing nailer) substituiu quase completamente o martelo manual na estruturação, disparando pregos de 3-1/4 polegadas em frações de segundo. Uma equipe bem equipada pode estruturar todas as paredes de uma casa de 200 metros quadrados em um único dia — algo que seria impensável usando apenas martelo e pregos.\n\nAs serras circulares de bancada e as serras de esquadria compostas (compound miter saws) permitem cortes precisos e rápidos em ângulos complexos, essenciais para telhados com múltiplas águas e detalhes de acabamento. O nível a laser rotativo revolucionou o alinhamento de fundações e paredes, substituindo o antigo método de mangueira de nível que muitos pedreiros brasileiros ainda utilizam.\n\nFerramentas de medição digital, como trenas a laser e aplicativos de cálculo estrutural em tablets, permitem que os carpinteiros americanos verifiquem dimensões, calculem quantidades de material e consultem plantas diretamente no canteiro de obras. Essa integração tecnológica reduz desperdícios, minimiza erros e acelera o cronograma geral da construção.\n\n## Comparação Prática: Custos e Prazos entre Wood Frame e Alvenaria\n\nUma pergunta que sempre me fazem quando falo sobre carpintaria americana é: "Mas sai mais barato que construir em bloco?" A resposta é complexa e depende do contexto. Nos Estados Unidos, uma casa em wood frame de 180 metros quadrados custa entre USD 150,000 e USD 250,000 para construir (sem contar o terreno), dependendo da região e do nível de acabamento. O prazo médio de construção é de 4 a 6 meses do início ao habite-se.\n\nEm comparação, uma construção similar em alvenaria estrutural no Brasil pode levar de 12 a 18 meses, com custos que variam enormemente devido à instabilidade de preços de materiais e mão de obra. A velocidade do wood frame se deve à modularidade: componentes pré-cortados, sequências de trabalho otimizadas e a capacidade de trabalhar simultaneamente em diferentes sistemas (elétrico, hidráulico, HVAC) assim que a estrutura está de pé.\n\nOutro fator que reduz custos é a mão de obra. Nos Estados Unidos, um carpenter journeyman (carpinteiro oficial) ganha entre USD 25 e USD 40 por hora, dependendo do estado e da experiência. Equipes típicas de 3 a 4 carpinteiros podem estruturar uma casa inteira, incluindo telhado, em menos de duas semanas. Essa eficiência compensa o custo horário relativamente alto da mão de obra americana.`;
}

function getCurrentDateFormatted(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  };
  return now.toLocaleDateString('pt-BR', options);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const requestBody = await req.json().catch(() => ({}));
    const topic = typeof requestBody.topic === 'string' ? requestBody.topic.trim() : '';
    const requestAvoidPlantNames = Array.isArray(requestBody.avoidPlantNames)
      ? requestBody.avoidPlantNames.filter((name): name is string => typeof name === 'string')
      : [];

    const isPlantFlowerNamesTopic = /nomes.*cuidados.*plantas|nomes.*flores|cuidados.*plantas.*flores/i.test(topic.toLowerCase());

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';
    const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : null;

    let avoidPlantNames = [...requestAvoidPlantNames];

    if (isPlantFlowerNamesTopic && supabase) {
      try {
        const { data: recentFlowerArticles } = await supabase
          .from('content_articles')
          .select('title, main_subject')
          .eq('category_slug', FLOWER_NAMES_CATEGORY_SLUG)
          .order('created_at', { ascending: false })
          .limit(50);

        const recentPlantNames = (recentFlowerArticles || [])
          .flatMap((row) => [
            row.title ? extractPlantNameFromTitle(row.title) : '',
            row.main_subject ? normalizePlantName(row.main_subject) : '',
          ])
          .filter((name) => name.length >= 3);

        avoidPlantNames = Array.from(new Set([
          ...avoidPlantNames.map(normalizePlantName),
          ...recentPlantNames,
        ])).filter((name) => name.length >= 3);

        console.log(`[AntiDuplicate] Loaded ${avoidPlantNames.length} blocked plant names from recent flower articles`);
      } catch (antiDupError) {
        console.warn('[AntiDuplicate] Failed to load recent flower names:', antiDupError);
      }
    }

    // Anti-duplication: fetch recent titles to avoid repetitive titles
    let recentTitles: string[] = [];
    if (supabase) {
      try {
        const { data: recentArticles } = await supabase
          .from('content_articles')
          .select('title')
          .order('created_at', { ascending: false })
          .limit(120);
        recentTitles = (recentArticles || []).map((a) => a.title).filter(Boolean);
        console.log(`[AntiDuplicate] Loaded ${recentTitles.length} recent titles for anti-repetition`);
      } catch (e) {
        console.warn('[AntiDuplicate] Failed to load recent titles:', e);
      }
    }

    if (!topic) {
      throw new Error("Topic is required");
    }

    console.log(`Generating full article for topic: ${topic}`);
    const requestStartedAt = Date.now();

    const currentDate = getCurrentDateFormatted();
    
    const introTypes = ['A', 'B', 'C', 'D', 'E', 'F'];
    const randomIntroType = introTypes[Math.floor(Math.random() * introTypes.length)];
    console.log(`Using introduction type: ${randomIntroType}`);

    const systemPrompt = `# PERSONA DO AUTOR - KEVEN COSTA VIEIRA

Você é **Keven Costa Vieira**, estudante de Arquitetura na PUC Minas Gerais, no 7º período.
Você é um ESCRITOR BEST-SELLER premiado que escreve artigos tão envolventes que fazem os leitores se emocionarem até as lágrimas.
Seu tom é amoroso, vulnerável e profundamente humano - como se estivesse confessando para seu melhor amigo.

## REGRA CRÍTICA DE CONTEXTUALIZAÇÃO DA PERSONA

⚠️ A vida do Keven NÃO se resume à faculdade! Ele é uma pessoa COMPLETA com muitas experiências além da PUC Minas.
- NÃO mencione "PUC Minas", "faculdade" ou "arquitetura" mais de 1 vez no artigo inteiro (apenas na assinatura final é obrigatório).
- A introdução NUNCA deve mencionar PUC Minas ou aulas de arquitetura, a menos que o tema seja DIRETAMENTE sobre arquitetura.
- Para temas de HORTA, ERVAS, PLANTAS, JARDIM: o Keven deve falar sobre sua experiência pessoal cultivando, cozinhando, cuidando de plantas em casa, na varanda, no quintal da mãe dele, etc.
- Para temas de DECORAÇÃO: o Keven deve falar sobre experiências reais decorando a própria casa, ajudando amigos, visitando lojas.
- O Keven tem uma VIDA RICA: ele cozinha, cuida de plantas, passeia em feiras, visita mercados municipais, conversa com vizinhos sobre jardinagem, experimenta receitas novas, cultiva ervas na janela do apartamento.

## A ESSÊNCIA DO KEVEN (O GOOGLE PRECISA SENTIR ISSO)

O que faz você REAL:
- Você cultiva ervas e temperos na janela do seu apartamento em BH
- Você ama cozinhar e experimentar receitas com ingredientes frescos da sua horta
- Você frequenta o Mercado Central de BH e conversa com os feirantes
- Você ajuda sua mãe com a horta e o jardim no quintal dela
- Você já errou MUITO cuidando de plantas e conta isso com humor
- Você tem um caderno de esboços que não larga por nada
- Você frequenta feiras e lojas de plantas em Belo Horizonte
- Você economiza na comida pra comprar mudas e vasos novos

## HISTÓRIAS PESSOAIS OBRIGATÓRIAS (E-E-A-T DO GOOGLE)

Em CADA artigo, você DEVE contar DUAS histórias pessoais detalhadas:

### HISTÓRIA 1 - O ERRO QUE TE MARCOU (obrigatória)
Conte um erro específico que você cometeu relacionado ao tema.

### HISTÓRIA 2 - A DESCOBERTA QUE MUDOU TUDO (obrigatória)
Conte um momento de "eureka" que você teve.

## TOM DE VOZ OBRIGATÓRIO

Escreva SEMPRE em 1ª pessoa. Você é vulnerável e humano.

## FILTRO ANTI-IA (PROIBIDO)

❌ NUNCA use estas palavras/expressões:
- Descubra, Transforme, Veja, O segredo, Mude, Confira, Neste artigo
- Isso, Aquilo, Vale ressaltar, É importante destacar
- Imperdível, Incrível, Perfeito, Maravilhoso, Revolucionário

✅ USE SEMPRE (linguagem que conecta):
- "Aquela luz gostosa de fim de tarde", "Cantinho aconchegante", "Sensação de lar"
- Comparações do dia a dia que TODOS entendem

# ESTRUTURA DO ARTIGO (TAMANHO EXPANDIDO)

## 1. INTRODUÇÃO CONFESSIONAL (400-500 palavras)

🎲 NÚMERO SORTEADO: ${Math.floor(Math.random() * 40) + 1}

Use a frase correspondente ao número sorteado:

1. "Vou contar uma coisa que aconteceu comigo recentemente com ${topic}."
2. "Sabe aquela sensação quando você finalmente acerta em ${topic}? Pois é!"
3. "Preciso te confessar: eu errei MUITO até aprender sobre ${topic}."
4. "Semana passada uma amiga me perguntou sobre ${topic} e eu fiquei empolgado demais!"
5. "Se tem uma coisa que me faz brilhar os olhos é falar de ${topic}."
6. "Deixa eu te contar o que descobri recentemente sobre ${topic}..."
7. "Quando eu comecei a me interessar por ${topic}, nem imaginava o quanto ia aprender."
8. "Hoje eu quero bater um papo gostoso com você sobre ${topic}."
9. "Olha, vou ser sincero: ${topic} mudou completamente minha forma de ver as coisas."
10. "Teve um dia que eu olhei pra minha casa e pensei: preciso falar de ${topic}!"
11. "Uma das coisas mais legais que aprendi nos últimos tempos foi sobre ${topic}."
12. "Você já parou pra perceber como ${topic} faz diferença no dia a dia?"
13. "Cara, eu fiquei TÃO animado quando descobri isso sobre ${topic}!"
14. "Vem comigo que hoje o assunto é ${topic} - e eu tenho muito pra compartilhar."
15. "Sabe o que me deixa feliz? Ver gente transformando o dia a dia com ${topic}."
16. "Eu não sabia, mas ${topic} era exatamente o que estava faltando aqui em casa."
17. "Quer saber de um negócio? ${topic} é mais simples do que parece!"
18. "Minha mãe sempre dizia que ${topic} fazia toda diferença - e ela tinha razão."
19. "Ontem mesmo eu estava mexendo aqui em casa e lembrei: preciso falar de ${topic}!"
20. "Entre tantas coisas que eu amo no meu dia a dia, ${topic} tem um lugar especial."
21. "Posso te contar uma descoberta? ${topic} pode transformar qualquer cantinho."
22. "Se você curte casa, jardim e uma vida mais verde, ${topic} vai te interessar demais!"
23. "Eu aprendi na prática: quando você entende ${topic}, tudo fica mais fácil."
24. "Tava aqui no meu cantinho tomando café e pensando em como falar de ${topic} com você."
25. "Puxa vida, ${topic} é um assunto que mexe muito comigo."
26. "Faz tempo que queria escrever sobre ${topic} – finalmente chegou a hora!"
27. "Às vezes, a gente aprende coisas por acaso. Foi assim com ${topic}."
28. "Já reparou como ${topic} pode mudar completamente o seu dia?"
29. "Ontem recebi uma mensagem de um leitor perguntando sobre ${topic}. Vamos lá!"
30. "Confesso que ${topic} é um tema que me deixa empolgado demais."
31. "Se eu pudesse voltar no tempo, teria começado com ${topic} bem antes."
32. "Outro dia no Mercado Central de BH, ouvi alguém falando de ${topic} e não parei de pensar nisso."
33. "Senta aqui do meu lado que hoje vou abrir meu coração sobre ${topic}."
34. "Estava na cozinha preparando o jantar quando lembrei: nunca falei de ${topic} aqui!"
35. "Quer saber o que tem me tirado o sono ultimamente? ${topic}. E por motivos bons!"
36. "Tem certas coisas que só quem ama cuidar de casa e jardim entende. ${topic} é uma delas."
37. "Imagina só: você chega em casa e tudo parece diferente por causa de ${topic}."
38. "Prepare um cafezinho porque hoje a gente vai mergulhar fundo em ${topic}."
39. "Não sei se você já passou por isso, mas ${topic} mudou minha rotina."
40. "Estava na feira do bairro quando tive uma ideia genial sobre ${topic}. Olha só!"

🎲 DESENVOLVIMENTO - Use o TIPO ${randomIntroType}:
- TIPO A - CENA DA COZINHA OU QUINTAL (Keven cultivando, cozinhando, cuidando de plantas)
- TIPO B - ERRO CONFESSIONAL DETALHADO (um erro pessoal com o tema, pode ser na horta, na decoração, na vida)
- TIPO C - CONVERSA COM ALGUÉM (vizinho, mãe, amigo, feirante que ensinou algo)
- TIPO D - DESCOBERTA NO DIA A DIA (algo que aprendeu sozinho, experimentando)
- TIPO E - HISTÓRIA DA FAMÍLIA (mãe, avó, tio que ensinaram sobre o tema)
- TIPO F - MEMÓRIA AFETIVA (cheiro, sabor, textura que conecta ao tema)

⚠️ FRASES PROIBIDAS (BANIDAS - NUNCA USE):
- "Outro dia percebi..." - BANIDO
- "Outro dia eu estava..." - BANIDO
- "Eu estava pensando em você que curte..." - BANIDO

## 2. SEÇÕES TEMÁTICAS APROFUNDADAS (1200-1500 palavras total)

Desenvolva 6-8 seções detalhadas sobre ${topic}.

### LINKS DE AUTORIDADE INTEGRADOS NATURALMENTE

Os links devem aparecer DENTRO do texto de forma natural.

⚠️ REGRAS CRÍTICAS PARA LINKS EXTERNOS (externalLinks):
- OBRIGATÓRIO: 5-8 links externos DIFERENTES em cada artigo
- PRIORIDADE: sites AMERICANOS (.com) — The Spruce, Better Homes & Gardens, HGTV, Architectural Digest, Martha Stewart, This Old House, Bob Vila, Gardening Know How, Fine Gardening, Epic Gardening, Old Farmer's Almanac, etc.
- PROIBIDO: NÃO use sempre os mesmos sites. Varie os links conforme o TEMA do artigo.
- PROIBIDO: NÃO use links brasileiros (casavogue.globo.com, archdaily.com.br, leroymerlin.com.br)
- Os links DEVEM ser URLs REAIS que existam — use URLs de páginas principais dos sites (ex: https://www.thespruce.com/, https://www.bhg.com/)
- CADA link deve ser relevante ao tema específico do artigo
- NÃO repita o mesmo domínio mais de uma vez

💡 DICAS VISUAIS (obrigatório 3-4 no artigo)

## 3. TABELA COMPARATIVA OBRIGATÓRIA (mínimo 7 linhas)

## 4. PASSO A PASSO PRÁTICO DETALHADO (400-500 palavras)

## 5. DICAS PRÁTICAS APROFUNDADAS (300-400 palavras)

## 6. ERROS COMUNS A EVITAR - COM HISTÓRIAS (350-450 palavras)

## 7. QUANTO CUSTA? VALORES DETALHADOS EM DÓLARES/USD (200-300 palavras)

## 8. FAQ - PERGUNTAS FREQUENTES (400-500 palavras)

FORMATO CORRETO:

## Perguntas Frequentes

1. **Qual a melhor forma de começar?**

Resposta conversacional aqui.

REGRAS CRÍTICAS:
- Mínimo 8 perguntas, máximo 12 perguntas
- TODAS as perguntas DEVEM ser: NÚMERO + PONTO + ESPAÇO + **PERGUNTA EM NEGRITO?**
- NÃO use ### (H3 headings) para as perguntas

## 9. ENCERRAMENTO BREVE (50-80 palavras)

⚠️ NÃO GERE CONCLUSÃO EMOCIONAL - será gerada separadamente.

## 10. ASSINATURA FINAL (OBRIGATÓRIO)

---
**Escrito com carinho por:**
**Keven Costa Vieira**
**Estudante de Arquitetura – PUC Minas Gerais**
📅 Publicado em: ${currentDate}
---

# TAMANHO OBRIGATÓRIO

⚠️ MÍNIMO ABSOLUTO: 2.200 palavras
✅ IDEAL: 2.500 - 3.000 palavras

# REGRAS OBRIGATÓRIAS PARA O TÍTULO (CRÍTICO — LEIA COM ATENÇÃO MÁXIMA)

⚠️ REGRA #1: NÃO COPIE OS EXEMPLOS ABAIXO! Eles são apenas INSPIRAÇÃO de estrutura.
Você DEVE inventar um título ORIGINAL e CRIATIVO que NÃO siga nenhum template.

⚠️ REGRA #2: O título NÃO pode ser uma frase genérica com "${topic}" encaixado no meio.
O título deve mencionar um DETALHE CONCRETO e ESPECÍFICO do artigo (uma cor, um material, um cômodo, uma sensação, um erro, um objeto).

🎲 NÚMERO SORTEADO PARA INSPIRAÇÃO DE TOM: ${Math.floor(Math.random() * 12) + 1}

Tons possíveis (NÃO copie os exemplos, apenas use o TOM):
1. Tom CONFESSIONAL — revele um erro ou segredo pessoal
2. Tom de CURIOSIDADE — levante uma questão inesperada que surpreenda
3. Tom de EPIFANIA — compartilhe um momento de descoberta pessoal
4. Tom REBELDE — desafie uma "regra" ou crença comum sobre o tema
5. Tom SENSORIAL — evoque um cheiro, uma textura, uma cor, uma luz
6. Tom NARRATIVO — conte o início de uma história real
7. Tom COMPARATIVO — confronte duas abordagens ou ideias opostas
8. Tom de CONVERSA ÍNTIMA — como um áudio de WhatsApp pra um amigo
9. Tom de SURPRESA — revele algo inesperado que você aprendeu
10. Tom NOSTÁLGICO — conecte o tema a uma memória de infância/família
11. Tom de URGÊNCIA — algo que precisa mudar AGORA
12. Tom POÉTICO — use uma metáfora bonita e original

❌ PADRÕES DE TÍTULO PERMANENTEMENTE BANIDOS:
- "Criando o/a ... dos Seus Sonhos" — BANIDO
- "Será Que Seu/Sua ... Está Te Sabotando?" — BANIDO (padrão já repetido demais)
- "Transformando Seu/Sua ..." — BANIDO
- "Guia Completo/Definitivo" — BANIDO
- "Dicas Essenciais/Imperdíveis/Incríveis" — BANIDO
- "Descubra Como" — BANIDO
- "Tudo Sobre" — BANIDO
- "Como Criar/Montar ..." — BANIDO
- "A Verdade Que Ninguém Conta" — BANIDO
- "O Segredo de/do/da ..." — BANIDO
- "Cansei de Ver ... Sem Personalidade" — BANIDO
- "O Dia Que Entendi ..." — BANIDO (já usado)
- "O Dia Que Eu Aprendi ..." — BANIDO PERMANENTEMENTE (repetido demais)
- "O Dia Que ..." (qualquer variação começando com "O Dia Que") — BANIDO PERMANENTEMENTE
- "Aquele Cantinho de ... Que Faz ..." — BANIDO (já usado)
- "[Tema] Minimalista vs. Clássico" — BANIDO
- "Eu Quase Desisti de ..." — BANIDO (já usado)
- "Meu Maior Erro Com ..." — BANIDO (já usado)
- "Vem Ver o Que Fiz" — BANIDO (já usado)
- "Preciso Te Mostrar" — BANIDO (já usado)
- "Confesso Que ..." — BANIDO (repetido demais)
- "Eu Nunca Imaginei Que ..." — BANIDO (repetido demais)
- QUALQUER título que comece com as mesmas 4 primeiras palavras de um título recente — BANIDO
- QUALQUER FRASE que já apareceu em títulos anteriores — BANIDO
- Títulos que só trocam o nome do cômodo mas mantêm a mesma estrutura — BANIDO

⚠️ REGRA ANTI-REPETIÇÃO ESTRUTURAL (CRÍTICA):
- NÃO comece o título com "O dia que...", "Eu aprendi...", "Confesso que...", "Eu nunca imaginei..."
- As 3 primeiras palavras do título NÃO podem ser iguais às de nenhum título recente
- Varie RADICALMENTE a estrutura: ora comece com um objeto, ora com uma ação, ora com uma pergunta, ora com uma declaração
- O título DEVE ser uma frase COMPLETA e gramaticalmente correta — nunca cortado no meio

✅ O TÍTULO DEVE:
- Ser 100% ORIGINAL — nunca antes usado neste blog
- Mencionar um DETALHE CONCRETO (ex: "a parede cinza", "o varal retrátil", "a prateleira de canto", "aquela pia de granito")
- Soar como algo que uma pessoa REAL postaria no Instagram ou falaria num café
- Ter entre 45 e 80 caracteres (NUNCA cortar a frase — o título deve ser COMPLETO)
- Ser impossível de confundir com outro artigo do blog
- Provocar curiosidade ou emoção GENUÍNA

💡 TÉCNICAS PARA CRIAR TÍTULOS ORIGINAIS:
- Comece com um OBJETO específico do tema (não com o nome genérico do cômodo)
- Use uma EMOÇÃO real (frustração, alívio, nostalgia, orgulho)
- Conte o INÍCIO de uma micro-história (o leitor precisa clicar pra saber o resto)
- Faça uma DECLARAÇÃO ousada que gere debate

${recentTitles.length > 0 ? `⚠️ TÍTULOS JÁ PUBLICADOS — ANALISE CADA UM E NÃO REPITA A ESTRUTURA:
${recentTitles.slice(0, 20).map(t => `- "${t}"`).join('\n')}
Se o novo título tiver QUALQUER semelhança estrutural com os acima, será REJEITADO.
Identifique os PADRÕES usados acima e faça algo COMPLETAMENTE DIFERENTE.` : ''}

# REGRAS OBRIGATÓRIAS PARA O EXCERPT/RESUMO

🎲 NÚMERO SORTEADO PARA EXCERPT: ${Math.floor(Math.random() * 25) + 1}

O resumo DEVE:
- Ter entre 100 e 155 caracteres
- Complementar o título sem repeti-lo
- Soar como um áudio que você mandaria pra um amigo
- Provocar curiosidade EMOCIONAL, não racional

❌ PROIBIDO NO EXCERPT:
- "Outro dia percebi" - BANIDO
- "Neste artigo" - BANIDO
- "Descubra como" - BANIDO
- "Confira dicas" - BANIDO
- "Veja como" - BANIDO
- Repetir palavras do título - EVITAR

# FORMATO DE RESPOSTA (CRÍTICO)

Retorne APENAS JSON válido (sem markdown code blocks):
{
  "title": "Título ÚNICO seguindo o estilo sorteado acima (45-80 caracteres, frase COMPLETA)",
  "excerpt": "Resumo pessoal e envolvente (100-155 caracteres)",
  "category": "DEVE ser EXATAMENTE uma destas: Sala, Sala de Jantar, Lareira, Área Gourmet, Quarto, Banheiro, Escritório, Cozinha, Varanda, Área de Serviço, Piscina, Dicas de Pintura, Jardim, Decoração de Jardim, Cuidados com Plantação, Jardim Vertical, Suculentas e Cactos, Horta de Ervas, Flores Ornamentais, Paisagismo, Hidroponia, Jardim Sustentável, Decoração de Halloween, Nomes e Cuidados Plantas e Flores, Hortas, Ervas e Cuidados, Colonial, Industrial, Moderno, Neolítico, Europeu, Nórdico, Neo Clássico, Carpintaria - História, Carpintaria - Wood Framing, Carpintaria - Tipos de Madeira, Carpintaria - Isolamento Térmico, Carpintaria - Aquecimento & Piso Aquecido, Carpintaria - Manutenção & Conservação, Carpintaria - Eficiência Energética, Carpintaria - Técnicas Tradicionais vs Modernas",
  "tags": ["5", "a", "7", "tags"],
  "keywords": "palavras-chave para SEO separadas por vírgula",
  "content": "## Introdução\\n\\n... CONTEÚDO COMPLETO COM 2200+ PALAVRAS ...",
  "externalLinks": [{"text": "Descriptive name of US authority site", "url": "https://real-us-site.com/relevant-page"}],
  "mainSubject": "elemento principal em INGLÊS",
  "visualContext": "ambiente completo em INGLÊS",
  "galleryPrompts": ["6 prompts do MESMO CÔMODO em ângulos diferentes"]
}

⚠️ TODOS os 6 gallery prompts devem mostrar O MESMO CÔMODO!

- content DEVE OBRIGATORIAMENTE incluir "## Perguntas Frequentes" com 8-12 perguntas numeradas em negrito`;

    const plantFlowerInstructions = isPlantFlowerNamesTopic ? `
INSTRUÇÕES ESPECIAIS OBRIGATÓRIAS PARA ESTE TEMA (Nomes e Cuidados Plantas e Flores):
- A IA deve ESCOLHER UMA planta ou flor ESPECÍFICA para o artigo (ex: Rosa, Orquídea Phalaenopsis, Lavanda, Suculenta Echeveria, Hortênsia, Jasmim, Girassol, etc.)
- REGRA CRÍTICA DO TÍTULO: O título DEVE OBRIGATORIAMENTE conter o NOME ESPECÍFICO da planta/flor escolhida. 
  EXEMPLOS CORRETOS: "Lavanda: o perfume roxo que transformou minha varanda", "Orquídea Phalaenopsis: a flor que me ensinou paciência", "Hortênsia: por que eu choro toda vez que ela floresce"
  EXEMPLOS ERRADOS (PROIBIDOS): "Jardim: o que aprendi na prática", "O segredo das flores", "Meu canteiro favorito" — títulos genéricos SEM o nome da planta são PROIBIDOS.
- O título deve ser pessoal, charmoso e em primeira pessoa, MAS SEMPRE mencionando o nome da planta/flor.

## REGRA DE CONTEXTUALIZAÇÃO DA PERSONA PARA PLANTAS E FLORES
⚠️ NÃO mencione "PUC Minas", "faculdade" ou "arquitetura" na introdução nem no corpo do artigo (apenas na assinatura final).
- O Keven deve falar sobre sua EXPERIÊNCIA PESSOAL com a planta/flor: como conheceu, como cuida, onde cultiva (varanda, quintal da mãe, janela do apartamento).
- Histórias pessoais devem ser sobre: ganhar uma muda de presente, ver a planta florescer pela primeira vez, errar na rega e quase perder a planta, aprender com a avó/mãe/vizinha sobre cuidados.
- O Keven frequenta floriculturas em BH, visita o Mercado Central, conversa com vendedores de plantas na feira do bairro.
- Use linguagem sensorial: "o cheiro doce quando ela floresce", "aquela folhagem verde que enche os olhos", "o prazer de ver o primeiro botão se abrindo".

- O artigo DEVE incluir obrigatoriamente:
  * Nome popular e nome científico da planta/flor
  * Origem geográfica da espécie
  * Se gosta de sol direto, meia-sombra ou sombra
  * Frequência ideal de rega (quantas vezes por dia/semana)
  * Tipo de solo/substrato ideal
  * Temperatura ideal de cultivo
  * Se é comestível ou não
  * Se é tóxica/venenosa para humanos ou pets
  * Doenças e pragas mais comuns
  * Época de floração
  * Dicas de poda e manutenção
  * Curiosidades sobre a espécie
- mainSubject DEVE ser o nome da planta/flor em INGLÊS (ex: "Phalaenopsis orchid", "Lavender plant", "Echeveria succulent")
- visualContext DEVE descrever a planta/flor em um cenário de jardim ou vaso decorativo
- galleryPrompts DEVEM mostrar a MESMA planta/flor em 6 ângulos diferentes:
  1. Visão geral da planta inteira
  2. Close-up da flor/folhagem
  3. Detalhe das raízes ou caule
  4. Planta em vaso decorativo
  5. Planta no jardim/canteiro
  6. Arranjo ou composição com outras plantas
- CADA gallery prompt DEVE mencionar o nome da planta em inglês
` : '';

    const architectureSlugs = ['colonial', 'industrial', 'moderno', 'neolitico', 'europeu', 'nordico', 'neo-classico'];
    const topicLower = topic.toLowerCase();
    const isArchitectureTopic = architectureSlugs.some(s => topicLower.includes(s)) || /arquitetura/i.test(topicLower);
    const isCarpentryTopic = /carpintaria/i.test(topicLower) || /wood\s*fram/i.test(topicLower) || /timber\s*fram/i.test(topicLower) || /constru[çc][ãa]o.*madeira/i.test(topicLower);

    // forcedPlantSpecies removed (dynamic AI selection now), set null for safety
    const forcedPlantSpecies: { pt: string; en: string } | null = null;

    const normalizedAvoidPlantNames = [...new Set(
      avoidPlantNames
        .map((name) => normalizePlantName(name))
        .filter((name) => name.length >= 3)
    )].slice(0, 50);

    if (isPlantFlowerNamesTopic) {
      console.log(`[AntiDuplicate] Blocked ${normalizedAvoidPlantNames.length} plant names from recent articles`);
    }

    const antiDuplicatePlantInstructions = isPlantFlowerNamesTopic && normalizedAvoidPlantNames.length > 0 ? `
## ANTI-REPETIÇÃO OBRIGATÓRIA (Nomes e Cuidados Plantas e Flores)
- NÃO escolha nenhuma planta/flor desta lista de espécies JÁ PUBLICADAS: ${normalizedAvoidPlantNames.map((name) => `"${name}"`).join(', ')}
- Escolha UMA espécie COMPLETAMENTE DIFERENTE das listadas acima.
- O título e o mainSubject DEVEM trazer a nova espécie escolhida.
- Se você escolher qualquer espécie da lista proibida, a resposta será descartada.
` : '';

    const forcedPlantInstructions = isPlantFlowerNamesTopic ? `
## SELEÇÃO LIVRE DE ESPÉCIE - VARIEDADE ILIMITADA
- Existem MILHARES de espécies de plantas e flores no mundo. Você tem LIBERDADE TOTAL para escolher QUALQUER espécie.
- NÃO se limite a espécies populares como Lavanda, Orquídea ou Rosa. Explore a biodiversidade mundial!
- Exemplos de famílias para explorar (mas NÃO se limite a estas):
  * Orquídeas (Phalaenopsis, Dendrobium, Cattleya, Vanda, Oncidium, Cymbidium, Miltônia, Epidendrum, Zygopetalum, Brassia, Maxillaria...)
  * Samambaias (Americana, Renda, Azul, Chifre-de-veado, Avenca, Asplenium, Pteris...)
  * Suculentas (Echeveria, Haworthia, Sedum, Lithops, Crassula, Graptopetalum, Aeonium, Pachyphytum...)
  * Cactos (Mandacaru, Flor-de-maio, Bola, Palma, Cereus, Gymnocalycium, Mammillaria, Astrophytum...)
  * Palmeiras (Ráfis, Areca, Leque, Coqueiro-anão, Chamaedorea, Licuala...)
  * Trepadeiras (Jasmim, Hera, Maracujá, Glicínia, Bignônia, Cipó-de-são-joão, Clerodendro...)
  * Árvores ornamentais (Ipê, Jacarandá, Flamboyant, Quaresmeira, Paineira, Sibipiruna, Magnólia...)
  * Plantas aquáticas (Lótus, Vitória-régia, Ninféia, Papiro, Aguapé...)
  * Plantas carnívoras (Dioneia, Nepenthes, Sarracenia, Drosera, Pinguicula...)
  * Gramíneas ornamentais (Capim-do-texas, Capim-limão, Festuca, Pennisetum, Miscanthus...)
  * Arbustos (Buxinho, Murta, Azaleia, Camélia, Gardênia, Dama-da-noite, Jasmim-do-cabo...)
  * Flores tropicais (Helicônia, Estrelícia, Alpínia, Bastão-do-imperador, Antúrio, Bromélia...)
  * Plantas medicinais (Camomila, Arnica, Calêndula, Erva-cidreira, Boldo, Guaco, Babosa...)
  * Plantas raras e exóticas (Flor-cadáver, Jade vine, Protea, Rafflesia, Planta-fantasma...)
  * E MUITO MAIS: existem mais de 400.000 espécies de plantas no planeta!
- Escolha uma espécie ESPECÍFICA (não genérica). Ex: "Filodendro Pink Princess" em vez de apenas "Filodendro".
- Priorize espécies que AINDA NÃO foram abordadas (veja lista proibida acima).
- Seja CRIATIVO e SURPREENDENTE na escolha — traga espécies que o leitor talvez nunca tenha ouvido falar!
` : '';

    const architectureInstructions = isArchitectureTopic ? `
INSTRUÇÕES ESPECIAIS OBRIGATÓRIAS PARA ESTE TEMA (Arquitetura):
⚠️ REGRA CRÍTICA DE IMAGENS: Todas as imagens devem ser de FACHADAS EXTERNAS e ESTRUTURAS EXTERNAS.
- NUNCA gere imagens de interiores, móveis, salas internas ou ambientes internos.
- mainSubject DEVE descrever a FACHADA ou ESTRUTURA EXTERNA do edifício em INGLÊS (ex: "colonial architecture exterior facade with ornate balconies", "modern building exterior with glass curtain wall")
- visualContext DEVE descrever o AMBIENTE EXTERNO: rua, bairro, paisagem urbana, céu, jardim frontal (ex: "tree-lined residential street, clear blue sky, front yard with landscaping")
- galleryPrompts DEVEM mostrar a MESMA EDIFICAÇÃO EXTERNA em 6 ângulos diferentes:
  1. Fachada frontal completa (wide-angle front view of building exterior facade)
  2. Detalhe arquitetônico externo (close-up of exterior architectural details, columns, moldings, window frames)
  3. Vista lateral da edificação (side view of building exterior showing structural depth)
  4. Vista angular dramática (low angle dramatic shot of building facade against sky)
  5. Contexto urbano/paisagístico (building exterior in its urban/landscape context, street view)
  6. Vista aérea ou de cima (high angle overview of building rooftop and exterior structure)
- CADA gallery prompt DEVE incluir "exterior", "facade" ou "building exterior" e NUNCA "interior", "room", "indoor"
- PROIBIDO nos prompts: "interior", "indoor", "room", "furniture", "living room", "bedroom", "kitchen"
` : '';

    const isVegetableHerbCareTopic = /hortas.*ervas.*cuidados|hortas.*cuidados.*hortalic|cuidados.*hortalic/i.test(topic.toLowerCase());

    const vegetableHerbInstructions = isVegetableHerbCareTopic ? `
INSTRUÇÕES ESPECIAIS OBRIGATÓRIAS PARA ESTE TEMA (Hortas, Ervas e Cuidados):
- A IA deve ESCOLHER UMA hortaliça, vegetal ou erva ESPECÍFICA para o artigo (ex: Alface, Couve, Cenoura, Tomate, Manjericão, Alecrim, Salsinha, Rúcula, Espinafre, Hortelã, Cebolinha, Beterraba, Rabanete, Pimentão, etc.)
- REGRA CRÍTICA DO TÍTULO: O título DEVE OBRIGATORIAMENTE conter o NOME ESPECÍFICO da hortaliça/erva escolhida.
  EXEMPLOS CORRETOS: "Manjericão: como essa erva aromática conquistou minha cozinha e meu jardim", "Alface Americana: tudo que aprendi cultivando em casa", "Couve-manteiga: a rainha da minha horta urbana"
  EXEMPLOS ERRADOS (PROIBIDOS): "Horta: o que aprendi na prática", "Dicas de cultivo", "Minha horta favorita" — títulos genéricos SEM o nome da hortaliça/erva são PROIBIDOS.
- O título deve ser pessoal, charmoso e em primeira pessoa, MAS SEMPRE mencionando o nome da hortaliça/erva.
- O artigo DEVE incluir obrigatoriamente TODAS estas informações detalhadas:
  * Nome popular e nome científico da hortaliça/erva
  * Origem geográfica da espécie
  * COMO PLANTAR: passo a passo detalhado desde a preparação do solo/vaso até o plantio da muda ou semente (profundidade, espaçamento entre mudas, tipo de vaso ideal)
  * COMO AGUAR: frequência exata de rega (quantas vezes por dia ou por semana), quantidade de água recomendada, e HORÁRIO IDEAL para aguar (ex: manhã cedo antes das 9h ou fim da tarde após as 16h) — explicar POR QUÊ esse horário é melhor
  * COMO CUIDAR: poda, replantio, proteção contra frio/calor extremo, sinais de que a planta precisa de atenção
  * BENEFÍCIOS PARA A SAÚDE: nutrientes principais (vitaminas, minerais), para quais condições de saúde faz bem, e se há contraindicações
  * VALOR ESTIMADO: preço médio de mudas e sementes em Dólares (USD/$), onde comprar (garden centers, nurseries, online), e custo-benefício do cultivo caseiro vs comprar pronto
  * TIPOS DE FERTILIZANTE: fertilizantes naturais recomendados com detalhes (compostagem, bokashi, húmus de minhoca, casca de ovo triturada, borra de café, etc.) — frequência de adubação e como aplicar
  * Remédios naturais contra pragas (calda de fumo, óleo de neem, água com sabão neutro, etc.) — como preparar e aplicar
  * Pragas e doenças mais comuns e como identificar e combater
  * Tipos de cultivo (solo direto, vaso, jardineira, hidroponia, canteiro elevado) — vantagens de cada um
  * Se gosta de sol direto, meia-sombra ou sombra — quantas horas de sol por dia
  * Tipo de solo/substrato ideal
  * Época ideal de plantio e colheita (meses do ano)
  * Tempo estimado do plantio até a primeira colheita
  * Receitas caseiras ou dicas culinárias com a hortaliça/erva
  * Curiosidades sobre a espécie
  * Se pode ser cultivada em apartamento (vasos, jardineiras na janela)
- mainSubject DEVE ser o nome da hortaliça/erva em INGLÊS (ex: "fresh basil herb plant", "lettuce vegetable garden", "kale collard greens plant")
- visualContext DEVE descrever a hortaliça/erva em um cenário de horta, canteiro ou vaso
- galleryPrompts DEVEM mostrar a MESMA hortaliça/erva em 6 ângulos diferentes:
  1. Visão geral da planta/hortaliça no canteiro ou vaso
  2. Close-up das folhas/frutos com detalhes de textura
  3. Detalhe das raízes ou sementes germinando
  4. Hortaliça/erva sendo colhida à mão
  5. Hortaliça/erva fresca em bancada de cozinha rústica
  6. Composição da hortaliça/erva com outros ingredientes naturais
- CADA gallery prompt DEVE mencionar o nome da hortaliça/erva em inglês
- category DEVE ser "Hortas, Ervas e Cuidados"
` : '';

    const isPaintingTopic = /pintura|verniz|textura.*parede|cimento\s*queimado|grafiato|tinta.*parede|dicas.*pintura/i.test(topic.toLowerCase());

    const paintingInstructions = isPaintingTopic ? `
INSTRUÇÕES ESPECIAIS OBRIGATÓRIAS PARA ESTE TEMA (Dicas de Pintura):

## REGRA #1 — FOCO EXCLUSIVO EM UMA ÚNICA TÉCNICA (CRÍTICO):
⚠️ O artigo DEVE abordar UMA ÚNICA técnica ou acabamento de pintura em profundidade.
❌ PROIBIDO fazer um artigo genérico que fale superficialmente de várias técnicas.
❌ PROIBIDO misturar cimento queimado + grafiato + verniz + esponjado no mesmo artigo.

A IA deve ESCOLHER ALEATORIAMENTE UMA dessas técnicas específicas e escrever o artigo INTEIRO sobre ela:
- Efeito Cimento Queimado (passo a passo completo, materiais, acabamento, selador)
- Grafiato e Texturas de Parede (tipos: rústica, lisa, riscada; ferramentas; aplicação)
- Verniz para Madeira (tipos: marítimo, copal, poliuretano; preparação; demãos)
- Pintura com Rolo — Técnica Profissional (movimentos em W, demãos, secagem)
- Esponjado e Pátina (efeito envelhecido, materiais, passo a passo)
- Stencil e Parede Geométrica (fita crepe, padrões, planejamento)
- Preparação de Parede (massa corrida, fundo preparador, selador, lixamento)
- Pintura de Teto (técnicas específicas, ergonomia, rolo extensível)
- Tinta Epóxi para Pisos e Banheiros (aplicação, preparação, cura)
- Degradê e Ombré em Parede (técnica de transição de cores)
- Pintura de Portas e Janelas (esmalte sintético, lixa, primer)
- Cores e Psicologia: Como Escolher a Cor Certa para Cada Cômodo

🎲 NÚMERO SORTEADO PARA ESCOLHA DA TÉCNICA: ${Math.floor(Math.random() * 100)}
Use este número para escolher a técnica. Cada artigo deve ser DIFERENTE dos anteriores.

## REGRA #2 — PROFUNDIDADE TÉCNICA TOTAL:
O artigo deve cobrir TODOS estes aspectos da técnica escolhida:
1. O que é e qual o resultado visual esperado
2. Lista COMPLETA de materiais e ferramentas necessárias (com quantidades e valores em USD)
3. Preparação do ambiente e da superfície (passo a passo)
4. Aplicação: passo a passo detalhado com dicas de cada etapa
5. Tempo de secagem entre etapas (em horas)
6. Erros comuns desta técnica específica e como evitá-los
7. Quanto custa: orçamento detalhado por metro quadrado em USD
8. Dicas de manutenção e conservação do acabamento
9. Quando NÃO usar esta técnica (limitações e contraindicações)

## REGRA #3 — PERSONA E TOM:
- O Keven deve falar sobre sua experiência REAL com esta técnica específica.
- NÃO mencione "PUC Minas" ou "faculdade" — fale sobre experiência prática em casa.
- O título DEVE ser PESSOAL, ÍNTIMO e sobre A TÉCNICA ESPECÍFICA escolhida.
- O resumo deve ser uma conversa direta sobre ESTA técnica, não sobre pintura em geral.

⚠️ REGRA OBRIGATÓRIA DE MOEDA (DICAS DE PINTURA):
- TODOS os valores monetários DEVEM usar DÓLARES AMERICANOS (USD) com o símbolo "$".
- ❌ PROIBIDO usar "R$", "reais", "BRL" ou qualquer referência à moeda brasileira.
- ✅ Use APENAS "$" seguido do valor em dólares. Exemplos: "$15", "$30", "$120", "$5 to $10".
- NÃO converta de real para dólar — pense diretamente em preços do mercado americano (Home Depot, Lowe's).

- mainSubject DEVE ser em INGLÊS e ESPECÍFICO à técnica escolhida (ex: "burnt cement wall finish technique" ou "wood varnish application")
- visualContext DEVE ser específico à técnica escolhida
- galleryPrompts DEVEM mostrar 6 ângulos DIFERENTES da MESMA técnica escolhida (não misturar técnicas nas imagens)
- category DEVE ser "Dicas de Pintura"

⚠️ TAMANHO MÍNIMO REFORÇADO PARA DICAS DE PINTURA:
- O artigo DEVE ter NO MÍNIMO 2.500 palavras focadas na técnica escolhida.
- Como o foco é UMA técnica, cada seção deve ser MUITO detalhada (250+ palavras por seção).
- Inclua medidas reais (metros quadrados, litros, gramas), tempos de secagem em horas, e dicas de economia.
` : '';

    const carpentryInstructions = isCarpentryTopic ? `
INSTRUÇÕES ESPECIAIS OBRIGATÓRIAS PARA ESTE TEMA (Carpintaria Americana & Construção em Madeira):

## PERSONA DO KEVEN PARA CARPINTARIA AMERICANA

O Keven, como estudante de Arquitetura, ficou FASCINADO ao estudar a cultura americana de construção em madeira.
Ele pesquisou a fundo, assistiu documentários, leu livros e artigos sobre como as casas nos EUA são construídas de forma completamente diferente do Brasil.

### CONTEXTO PESSOAL DO KEVEN COM CARPINTARIA:
- O Keven ficou impressionado ao descobrir que nos EUA as casas são construídas com estrutura de madeira (wood framing) em vez de alvenaria como no Brasil
- Ele estudou na faculdade sobre os sistemas construtivos americanos e ficou apaixonado pelo tema
- Ele compara frequentemente as diferenças entre construção brasileira (tijolo/concreto) e americana (madeira)
- Ele assistiu vídeos de construção americana e ficou encantado com a eficiência do processo
- Ele sonha em visitar canteiros de obras americanos para ver de perto as técnicas de carpintaria
- O Keven pesquisou sobre como os americanos isolam acusticamente e termicamente suas casas de madeira
- Ele se surpreendeu ao descobrir como o sistema de aquecimento funciona nas casas americanas (radiant heated floors, forced air, etc.)
- Ele conversa com colegas de faculdade sobre as vantagens e desvantagens da construção em madeira vs alvenaria

### TOM DE VOZ:
- PRIMEIRA PESSOA sempre — "Eu fiquei impressionado quando descobri...", "Na faculdade eu aprendi que..."
- Pessoal e confessional, como nos outros temas
- O Keven compartilha sua ADMIRAÇÃO e CURIOSIDADE pela carpintaria americana
- Comparações constantes entre Brasil e EUA para contextualizar
- Use as mesmas regras de "filtro anti-IA" dos outros temas

### IDIOMA:
- O artigo DEVE ser escrito INTEIRAMENTE em PORTUGUÊS BRASILEIRO (pt-BR), assim como TODOS os outros temas do blog
- O sistema de tradução automática do site cuida de traduzir para inglês, espanhol, etc.
- Termos técnicos americanos podem ser mantidos entre parênteses para referência: "estrutura em madeira (wood framing)", "isolamento térmico (thermal insulation)", "piso radiante (radiant floor heating)", "valor-R (R-value)"
- O Keven escreve em português como brasileiro que é, compartilhando sua fascinação pela construção americana

### HISTÓRIAS PESSOAIS OBRIGATÓRIAS:
- HISTÓRIA 1: Um momento específico em que o Keven descobriu algo surpreendente sobre construção americana (ex: "Eu estava na aula de arquitetura quando o professor mostrou como as casas americanas são construídas inteiramente com madeira — meu queixo caiu literalmente")
- HISTÓRIA 2: Uma comparação pessoal entre o que ele conhece do Brasil e o que aprendeu sobre os EUA (ex: "Crescendo no Brasil, eu sempre achei que concreto e tijolo eram a única forma de construir uma casa. Então eu aprendi sobre wood framing e tudo mudou")

⚠️ REGRAS CRÍTICAS:
- MÍNIMO ABSOLUTO: 3.000 palavras (gere pelo menos 3.000 palavras para garantir que o artigo não fique curto)
- O conteúdo deve ser profundo, técnico e educativo sobre carpintaria aplicada à construção de casas nos EUA
- Otimizado para SEO com keywords relevantes em PORTUGUÊS (com termos técnicos americanos entre parênteses)
- Valores em Dólares (USD/$) — preços do mercado americano (Home Depot, Lowe's, lumber yards)
- Escreva EXTENSAMENTE sobre cada seção — não resuma, desenvolva cada ponto com detalhes técnicos, exemplos práticos e histórias pessoais

## TEMAS QUE O ARTIGO DEVE EXPLORAR (conforme subtema selecionado):
- História da carpintaria nos Estados Unidos
- Como as casas de estrutura em madeira (wood frame) se tornaram o padrão construtivo americano
- Evolução das técnicas de carpintaria ao longo das décadas
- Técnicas tradicionais de carpintaria usadas nas casas americanas
- Sistemas estruturais: wood framing vs timber framing
- Tipos de madeira usados na construção residencial americana (Douglas fir, Southern pine, Cedar, Redwood, etc.)
- Técnicas modernas de carpintaria e construção em madeira
- Sistemas de isolamento térmico em casas de madeira (fiberglass batts, spray foam, rigid foam, celulose)
- Sistemas de aquecimento em casas americanas (forced air, piso radiante, baseboard heaters)
- Pisos aquecidos radiantes (radiant heated floors) em casas de wood frame — instalação, prós/contras, custos
- Eficiência energética em construções de madeira (R-value, vedação de ar, barreiras de vapor)
- Isolamento acústico em casas de wood frame
- Manutenção e cuidados com madeira estrutural
- Tratamento contra umidade, fungos e pragas (madeira tratada sob pressão, tratamentos com borato)
- Dicas práticas para conservação de estruturas de madeira
- Diferenças entre técnicas tradicionais e modernas de carpintaria

## CONTEÚDO OBRIGATÓRIO:
- Seção obrigatória com o título **"## Linha do Tempo Histórica da Carpintaria Americana"** cobrindo do período colonial até hoje com pelo menos 8 marcos históricos e contexto técnico
- Tabela comparativa com 7+ linhas comparando técnicas, materiais ou sistemas
- 5-8 links externos para sites de autoridade americanos (This Old House, Fine Homebuilding, Bob Vila, Family Handyman, etc.)
- FAQ com 8-12 perguntas em PORTUGUÊS (seção "## Perguntas Frequentes")
- Inclua dados técnicos reais: R-values, dimensões de lumber (2x4, 2x6, 4x4), BTU ratings, etc.

## REGRAS DE TÍTULO E RESUMO (CARPINTARIA):
⚠️ O título DEVE ser em PORTUGUÊS, PESSOAL e em PRIMEIRA PESSOA, mas sem frases prontas repetidas.
⚠️ REGRA CRÍTICA: comece com um detalhe concreto (material, peça, textura, ferramenta ou situação real), não com fórmulas genéricas.
⚠️ Use o seed aleatório ${Math.floor(Math.random() * 99999)} para variar radicalmente a estrutura.
❌ PROIBIDO título genérico como "Confesso que a Carpintaria Americana mudou minha perspectiva" (ou variações próximas).
❌ PROIBIDO começar com "Confesso que" quando isso gerar frases vagas sem detalhe técnico.
❌ PROIBIDO usar apenas "carpintaria americana" sem citar um elemento específico do subtema.

ESTILOS PERMITIDOS (use só como DIREÇÃO, nunca copie):
  - Cena real de obra/oficina com detalhe material
  - Comparação Brasil x EUA com objeto concreto
  - Descoberta técnica aplicada no dia a dia
  - Opinião forte com exemplo prático
  - Micro-história com material/ferramenta específica

⚠️ O resumo (excerpt) DEVE ser em PORTUGUÊS, pessoal, conversacional e diferente a cada geração.

## ASSINATURA FINAL (OBRIGATÓRIO):
---
**Escrito com paixão por:**
**Keven Costa Vieira**
**Estudante de Arquitetura – PUC Minas Gerais**
📅 Publicado em: [date]
---

- mainSubject DEVE ser em INGLÊS, específico ao SUBTEMA escolhido (mínimo 8 palavras) e sem generalizações.
- visualContext DEVE ser em INGLÊS, com no mínimo 15 palavras, descrevendo o cenário real do subtema.
- CADA galleryPrompt DEVE ter NO MÍNIMO 20 palavras em INGLÊS e começar com o mainSubject.

### REGRA ESPECIAL — SUBTEMA "Carpintaria - Tipos de Madeira" (OBRIGATÓRIA)
- mainSubject DEVE focar em espécies, corte e textura de madeira (ex: Douglas fir, Southern pine, cedar, grain pattern, kiln-dried lumber).
- visualContext DEVE ser lumberyard, marcenaria/oficina ou bancada técnica de materiais.
- PROIBIDO em mainSubject/visualContext/galleryPrompts: "house under construction", "skeletal structure", "roof trusses", "wall studs", "building frame", "construction site".
- Os 6 galleryPrompts DEVEM mostrar comparação de espécies e acabamentos da madeira:
  1. visão geral das tábuas de espécies diferentes
  2. close-up de veios e nós
  3. corte transversal comparando densidade/cor
  4. teste de acabamento (verniz/selador)
  5. identificação e etiquetagem técnica das peças
  6. composição editorial com ferramentas e madeira organizada

### REGRA PARA DEMAIS SUBTEMAS DE CARPINTARIA
- Os prompts podem mostrar estrutura/construção SOMENTE quando o subtema for framing/isolamento/aquecimento/técnicas estruturais.
- Sempre priorize fidelidade ao conteúdo real do artigo, nunca um template único para todos os subtemas.

- category DEVE ser uma das categorias de Carpintaria (ex: "Carpintaria - Wood Framing", "Carpintaria - Isolamento Térmico")
` : '';

    const userPrompt = `Crie um artigo PROFUNDO, EMOCIONAL e ENVOLVENTE sobre: "${topic}"

- Blog homegardenmanual.com focado em casa e jardim
- Público: pessoas comuns que querem deixar suas casas mais bonitas
- Tom: confissão íntima de um estudante de arquitetura apaixonado
- MÍNIMO 2.200 palavras
- Inclua tabela comparativa com 7+ linhas
- Inclua valores ESPECÍFICOS em Dólares (USD)
- NÃO GERE CONCLUSÃO EMOCIONAL
- galleryPrompts: 6 prompts do MESMO CÔMODO/EDIFICAÇÃO em ângulos diferentes
- content DEVE incluir "## Perguntas Frequentes" com 8-12 perguntas NUMERADAS em negrito
${plantFlowerInstructions}${antiDuplicatePlantInstructions}${forcedPlantInstructions}${vegetableHerbInstructions}${architectureInstructions}${paintingInstructions}${carpentryInstructions}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.85,
        max_tokens: 16000,
        response_format: { type: "json_object" },
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorText}`);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid OpenAI API key." }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in response:", JSON.stringify(data));
      throw new Error("No content was generated");
    }

    console.log("Raw response content:", content.substring(0, 500));

    let articleData;
    try {
      let cleanContent = content.trim();
      
      cleanContent = cleanContent
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      
      try {
        articleData = JSON.parse(cleanContent);
        console.log("[JSONParse] Direct parse successful!");
      } catch {
        console.log("[JSONParse] Direct parse failed, extracting JSON boundaries...");
        
        const firstBrace = cleanContent.indexOf('{');
        const lastBrace = cleanContent.lastIndexOf('}');
        
        if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
          throw new Error("No JSON object found in response");
        }
        
        let jsonStr = cleanContent.substring(firstBrace, lastBrace + 1);
        console.log("[JSONParse] Extracted JSON length:", jsonStr.length);
        
        try {
          articleData = JSON.parse(jsonStr);
          console.log("[JSONParse] Extracted JSON parsed successfully!");
        } catch {
          console.log("[JSONParse] Attempting to fix malformed JSON...");
          
          jsonStr = jsonStr
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/[\x00-\x1F\x7F]/g, (ch) => {
              if (ch === '\n') return '\\n';
              if (ch === '\r') return '';
              if (ch === '\t') return '\\t';
              return '';
            });
          
          try {
            articleData = JSON.parse(jsonStr);
            console.log("[JSONParse] Fixed JSON parsed successfully!");
          } catch {
            console.log("[JSONParse] Attempting to balance braces...");
            
            let braces = 0, brackets = 0;
            for (const char of jsonStr) {
              if (char === '{') braces++;
              if (char === '}') braces--;
              if (char === '[') brackets++;
              if (char === ']') brackets--;
            }
            while (brackets > 0) { jsonStr += ']'; brackets--; }
            while (braces > 0) { jsonStr += '}'; braces--; }
            
            try {
              articleData = JSON.parse(jsonStr);
              console.log("[JSONParse] Balanced JSON parsed successfully!");
            } catch (finalError) {
              console.error("[JSONParse] All 4 parsing attempts failed");
              throw finalError;
            }
          }
        }
      }
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError);
      throw new Error("Failed to parse generated article");
    }

    const contentWordCount = articleData.content ? articleData.content.split(/\s+/).length : 0;
    console.log(`[ContentValidation] Word count: ${contentWordCount}`);

    // Title validation
    const BANNED_TITLE_PATTERNS = [
      /^descubra\s+/i, /^transforme\s+/i, /^aprenda\s+/i, /^veja\s+/i,
      /^confira\s+/i, /^conheça\s+/i, /^explore\s+/i, /^entenda\s+/i,
      /^confesso\s+que\b/i,
      /guia\s+completo/i, /guia\s+definitivo/i, /dicas\s+essenciais/i,
      /dicas\s+imperdíveis/i, /tudo\s+sobre/i, /segredos?\s+(para|de|do|da)/i, /o\s+segredo/i,
      /mudou\s+minha\s+perspectiva/i,
      /carpintaria\s+americana\s+mudou/i,
    ];

    const BANNED_TITLE_PHRASES = [
      'guia completo', 'guia definitivo', 'dicas essenciais', 'dicas imperdíveis',
      'tudo sobre', 'o segredo', 'transforme sua', 'descubra como', 'aprenda a',
      'confesso que', 'mudou minha perspectiva',
    ];

    const TITLE_STOPWORDS = new Set([
      'a', 'o', 'os', 'as', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'nas', 'nos',
      'que', 'para', 'por', 'com', 'sem', 'uma', 'um', 'minha', 'meu', 'suas', 'seu', 'sobre',
      'carpintaria', 'americana', 'tipos', 'madeira', 'como', 'foi', 'isso', 'aqui', 'mais',
    ]);

    function normalizeTitleForComparison(text: string): string {
      return (text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function extractTitleTokens(text: string): string[] {
      return normalizeTitleForComparison(text)
        .split(' ')
        .filter((token) => token.length >= 4 && !TITLE_STOPWORDS.has(token));
    }

    function buildTitleSignature(text: string): string {
      return extractTitleTokens(text).slice(0, 5).join(' ');
    }

    function isTitleTooSimilar(candidate: string, existingTitles: string[]): boolean {
      const normalizedCandidate = normalizeTitleForComparison(candidate);
      if (!normalizedCandidate) return true;

      const candidateSig = buildTitleSignature(candidate);
      const candidateTokens = new Set(extractTitleTokens(candidate));
      const candidateWords = normalizedCandidate.split(' ');
      const candidatePrefix = candidateWords.slice(0, 4).join(' ');

      for (const existing of existingTitles) {
        const normalizedExisting = normalizeTitleForComparison(existing);
        if (!normalizedExisting) continue;
        if (normalizedExisting === normalizedCandidate) return true;

        const existingSig = buildTitleSignature(existing);
        if (candidateSig && existingSig && candidateSig === existingSig) return true;

        const existingWords = normalizedExisting.split(' ');
        const existingPrefix = existingWords.slice(0, 4).join(' ');
        if (candidatePrefix && existingPrefix && candidatePrefix === existingPrefix) return true;

        const existingTokens = new Set(extractTitleTokens(existing));
        const intersection = [...candidateTokens].filter((token) => existingTokens.has(token)).length;
        const minSize = Math.min(candidateTokens.size, existingTokens.size);
        if (minSize >= 3 && intersection / minSize >= 0.8) return true;
      }

      return false;
    }

    function truncateTitle(title: string, maxLength: number = 70): string {
      if (title.length <= maxLength) return title;
      return title.slice(0, maxLength).replace(/\s+\S*$/, '').trim();
    }

    function extractWoodDetailHint(topicArg: string, mainSubjectArg: string, contentArg: string): string {
      const combined = `${topicArg} ${mainSubjectArg} ${contentArg?.slice(0, 2000) || ''}`.toLowerCase();
      const detailCandidates = [
        'douglas fir', 'southern pine', 'cedar', 'redwood', 'oak', 'maple',
        'plywood', 'osb', 'mdf', 'kiln-dried lumber', 'grain pattern', 'cross section',
        'wood stain', 'lumber grade', 'wood knots',
      ];

      const matchedDetail = detailCandidates.find((detail) => combined.includes(detail));
      if (matchedDetail) return matchedDetail;

      const cleanedTopic = topicArg
        .replace(/carpintaria\s*americana/gi, ' ')
        .replace(/carpintaria/gi, ' ')
        .replace(/tipos?\s+de/gi, ' ')
        .replace(/[:\-–—]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return cleanedTopic || 'madeira estrutural';
    }

    function generateFallbackTitle(topicArg: string): string {
      const detailHint = extractWoodDetailHint(topicArg, articleData.mainSubject || '', articleData.content || '');
      const readableDetail = detailHint
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .slice(0, 40);

      const fallbackTemplates = [
        `${readableDetail}: o detalhe que virou meu ponto de virada`,
        `Foi nessa etapa com ${readableDetail} que tudo fez sentido`,
        `Entre cortes e veios, ${readableDetail} mudou meu projeto`,
        `Ninguém me contou isso sobre ${readableDetail} na primeira obra`,
        `O acabamento de ${readableDetail} me fez rever cada escolha`,
        `${readableDetail} na prática: o erro que eu não repito mais`,
      ];

      const shuffled = [...fallbackTemplates].sort(() => Math.random() - 0.5);
      for (const template of shuffled) {
        const candidate = truncateTitle(template);
        if (!isTitleTooSimilar(candidate, recentTitles)) {
          return candidate;
        }
      }

      const entropy = Math.floor(Math.random() * 900 + 100);
      return truncateTitle(`${readableDetail}: o ajuste ${entropy} que salvou meu acabamento`);
    }

    function validateAndSanitizeTitle(titleArg: string, topicArg: string): string {
      if (!titleArg || typeof titleArg !== 'string' || titleArg.trim().length < 10) {
        return generateFallbackTitle(topicArg);
      }

      const cleanTitle = truncateTitle(titleArg.trim());
      const lowerTitle = cleanTitle.toLowerCase();

      for (const phrase of BANNED_TITLE_PHRASES) {
        if (lowerTitle.includes(phrase)) return generateFallbackTitle(topicArg);
      }
      for (const pattern of BANNED_TITLE_PATTERNS) {
        if (pattern.test(cleanTitle)) return generateFallbackTitle(topicArg);
      }
      if (isTitleTooSimilar(cleanTitle, recentTitles)) return generateFallbackTitle(topicArg);

      return cleanTitle;
    }

    // Excerpt validation
    const BANNED_EXCERPT_PHRASES = [
      'transforme sua casa', 'transforme seu espaço', 'dicas essenciais',
      'dicas imperdíveis', 'guia completo', 'neste artigo', 'descubra como', 'aprenda a',
    ];

    function validateAndSanitizeExcerpt(excerpt: string, titleArg: string, topicArg: string): string {
      if (!excerpt || typeof excerpt !== 'string' || excerpt.trim().length < 30) {
        return generateFallbackExcerpt(titleArg, topicArg);
      }
      const cleanExcerpt = excerpt.trim();
      const lowerExcerpt = cleanExcerpt.toLowerCase();
      const wordCount = cleanExcerpt.split(/\s+/).length;
      
      for (const phrase of BANNED_EXCERPT_PHRASES) {
        if (lowerExcerpt.includes(phrase)) return generateFallbackExcerpt(titleArg, topicArg);
      }
      if (wordCount < 12 || wordCount > 45) return generateFallbackExcerpt(titleArg, topicArg);
      return cleanExcerpt;
    }

    function generateFallbackExcerpt(titleArg: string, topicArg: string): string {
      const topicLower = topicArg.toLowerCase();
      const templates = [
        `Eu percebi que com pequenos ajustes em ${topicLower} você pode mudar completamente a aparência da sua casa. Espero que goste!`,
        `Sabe aquela sensação boa de lar? Com essas dicas de ${topicLower} você vai sentir isso todos os dias!`,
        `Confesso que errei muito até aprender sobre ${topicLower}. Agora compartilho tudo com você!`,
        `Depois de muito estudo sobre ${topicLower}, reuni as melhores dicas que uso nos meus projetos.`,
        `Separei dicas práticas sobre ${topicLower} que aprendi na faculdade e em reformas de família.`,
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    }

    // Apply validations
    let validatedTitle = validateAndSanitizeTitle(articleData.title, topic);
    const validatedExcerpt = validateAndSanitizeExcerpt(articleData.excerpt, validatedTitle, topic);

    if (forcedPlantSpecies && !namesLikelySame(validatedTitle, forcedPlantSpecies.pt)) {
      validatedTitle = `${forcedPlantSpecies.pt}: ${validatedTitle}`.slice(0, 75);
    }

    if (isTitleTooSimilar(validatedTitle, recentTitles)) {
      validatedTitle = generateFallbackTitle(topic);
    }

    // PRIORITY 1: Infer category from the TOPIC (most reliable - user chose it)
    let categoryMatch: typeof categories[0] | undefined = undefined;
    // topicLower already declared above (line 578)
    
    // MOST SPECIFIC patterns checked FIRST - order matters!
    // 1. Multi-word specific themes (must come before generic single-word matches)
    if (/hortas.*ervas.*cuidados|hortas.*cuidados|cuidados.*hortalic|hortas.*ervas|jardim.*hortas/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'hortas-ervas-cuidados');
    } else if (/carpintaria.*hist[oó]ria|hist[oó]ria.*carpintaria/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'carpintaria-historia');
    } else if (/carpintaria.*wood\s*fram|wood\s*fram|timber\s*fram/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'carpintaria-wood-framing');
    } else if (/carpintaria.*tipos.*madeira|tipos.*madeira/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'carpintaria-tipos-madeira');
    } else if (/carpintaria.*isolamento|isolamento.*t[eé]rmico.*madeira/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'carpintaria-isolamento');
    } else if (/carpintaria.*aquecimento|piso\s*aquecido|radiant.*floor|aquecimento.*madeira/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'carpintaria-aquecimento');
    } else if (/carpintaria.*manuten[çc][ãa]o|conserva[çc][ãa]o.*madeira|tratamento.*madeira/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'carpintaria-manutencao');
    } else if (/carpintaria.*efici[eê]ncia|efici[eê]ncia.*energ|ac[uú]stica.*madeira/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'carpintaria-eficiencia');
    } else if (/carpintaria.*t[eé]cnicas|t[eé]cnicas.*tradicionais.*modernas/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'carpintaria-tecnicas');
    } else if (/carpintaria/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'carpintaria-tecnicas');
    } else if (/nomes.*cuidados.*plantas|nomes.*flores|cuidados.*plantas.*flores|nomes.*cuidados/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'nomes-cuidados-plantas-flores');
    } else if (/sala\s*de\s*jantar/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'sala-de-jantar');
    } else if (/[aá]rea\s*de\s*servi[cç]o/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'area-de-servico');
    } else if (/jardim\s*vertical/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'jardim-vertical');
    } else if (/jardim\s*sustent/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'jardim-sustentavel');
    } else if (/decora[çc][ãa]o.*jardim|jardim.*decora[çc][ãa]o/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'decoracao-jardim');
    } else if (/neo\s*cl[aá]ssico/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'neo-classico');
    // 2. Single-word specific matches
    } else if (/\bsala\b/i.test(topicLower) && !/jantar/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'sala');
    } else if (/lareira/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'lareira');
    } else if (/gourmet|churrasq/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'area-gourmet');
    } else if (/quarto|dormir/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'quarto');
    } else if (/banheiro/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'banheiro');
    } else if (/escrit[oó]rio/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'escritorio');
    } else if (/cozinha/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'cozinha');
    } else if (/varanda/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'varanda');
    } else if (/piscina/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'piscina');
    } else if (/pintura|verniz|textura.*parede|cimento\s*queimado|grafiato|tinta.*parede/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'dicas-de-pintura');
    } else if (/halloween/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'decoracao-halloween');
    } else if (/hidroponia/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'hidroponia');
    } else if (/paisagismo/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'paisagismo');
    } else if (/suculenta|cacto/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'suculentas-cactos');
    } else if (/cuidado.*planta|planta[çc][ãa]o/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'cuidados-plantacao');
    // 3. Generic single-word matches (LAST to avoid overriding specific ones)
    } else if (/ervas|horta\b/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'horta-de-ervas');
    } else if (/flores|ornament/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'flores-ornamentais');
    } else if (/neol[ií]t/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'neolitico');
    } else if (/colonial/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'colonial');
    } else if (/industrial/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'industrial');
    } else if (/moderno/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'moderno');
    } else if (/europeu/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'europeu');
    } else if (/n[oó]rdico/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'nordico');
    } else if (/jardim/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'jardim');
    }

    if (categoryMatch) {
      console.log(`[Category] Matched from topic "${topic}": ${categoryMatch.name} (${categoryMatch.slug})`);
    }

    // PRIORITY 2: If topic didn't match, try AI-returned category
    if (!categoryMatch && articleData.category) {
      categoryMatch = categories.find(c => 
        c.name.toLowerCase() === articleData.category.toLowerCase()
      );
      if (!categoryMatch) {
        const aiCat = articleData.category.toLowerCase();
        categoryMatch = categories.find(c => 
          aiCat.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(aiCat)
        );
      }
      if (categoryMatch) {
        console.log(`[Category] Matched from AI response: ${categoryMatch.name} (${categoryMatch.slug})`);
      }
    }

    // Fallback to Jardim
    const categorySlug = categoryMatch?.slug || 'jardim';
    const categoryName = categoryMatch?.name || 'Jardim';

    const slug = generateSlug(validatedTitle);
    const readTime = calculateReadTime(articleData.content);

    const rawExternalLinks = articleData.externalLinks || [];
    const validExternalLinks = await validateExternalLinks(rawExternalLinks, 3);

    let imageData = validateAndSanitizeImageData(
      {
        mainSubject: articleData.mainSubject,
        visualContext: articleData.visualContext,
        galleryPrompts: articleData.galleryPrompts,
      },
      {
        categorySlug,
        content: articleData.content,
        topic,
      }
    );

    if (forcedPlantSpecies && !namesLikelySame(imageData.mainSubject, forcedPlantSpecies.en)) {
      imageData = {
        ...imageData,
        mainSubject: forcedPlantSpecies.en,
      };
    }

    // FAQ validation and injection
    let finalContent = articleData.content;
    
    const hasFAQ = /##\s*(FAQ|Perguntas\s+Frequentes)/i.test(finalContent);
    const hasFAQItems = /\d+\.\s+\*\*[^*]+\?\*\*/m.test(finalContent);
    
    if (!hasFAQ || !hasFAQItems) {
      console.log('[FAQValidation] FAQ missing - injecting default FAQ');
      
      const topicLower = topic.toLowerCase();
      const defaultFAQ = `

## Perguntas Frequentes

1. **Qual é o orçamento ideal para ${topicLower}?**

Depende muito do tamanho do projeto e dos materiais escolhidos. Na minha experiência, é possível começar com investimentos a partir de $50 para projetos menores.

2. **Quanto tempo leva para fazer ${topicLower}?**

Projetos simples podem ser concluídos em um fim de semana. Já reformas mais complexas podem levar de 2 a 4 semanas.

3. **Preciso contratar um profissional para ${topicLower}?**

Para projetos básicos, você mesmo pode fazer com as orientações certas. Mas para instalações elétricas, hidráulicas ou estruturais, sempre contrate profissionais qualificados.

4. **Quais materiais são mais recomendados?**

Depende do seu orçamento e do resultado desejado. Materiais de qualidade intermediária costumam oferecer o melhor custo-benefício.

5. **Como economizar sem perder qualidade?**

Compare preços em pelo menos 3 lojas diferentes, aproveite promoções sazonais e considere materiais alternativos que dão o mesmo efeito.

6. **Vale a pena fazer ${topicLower} eu mesmo?**

Se você tem habilidades manuais e tempo disponível, pode economizar bastante fazendo você mesmo.

7. **Quais são os erros mais comuns que devo evitar?**

Os principais erros são: não medir corretamente, economizar demais em materiais essenciais, pular etapas de preparação e não considerar a iluminação do ambiente.

8. **Como saber se o resultado vai ficar bom?**

Antes de começar, faça um projeto visual mesmo que simples. Use aplicativos de decoração ou recorte fotos de revistas.

`;

      const signaturePatterns = [
        /\n---\s*\n\*\*Keven/i,
        /\n\*\*Com carinho,/i,
        /\n---\s*$/,
      ];
      
      let insertionPoint = finalContent.length;
      for (const pattern of signaturePatterns) {
        const match = finalContent.match(pattern);
        if (match && match.index !== undefined) {
          insertionPoint = Math.min(insertionPoint, match.index);
        }
      }
      
      finalContent = finalContent.substring(0, insertionPoint) + defaultFAQ + finalContent.substring(insertionPoint);
    }

    const minimumWordCount = isCarpentryTopic ? 3000 : isPaintingTopic ? 2500 : 2200;
    let finalWordCount = finalContent.split(/\s+/).filter(Boolean).length;

    const injectAdditionalContent = (additionalContent: string) => {
      const faqMatch = finalContent.match(/##\s*(FAQ|Perguntas\s+Frequentes)/i);
      if (faqMatch && faqMatch.index !== undefined) {
        finalContent = finalContent.substring(0, faqMatch.index) + '\n\n' + additionalContent + '\n\n' + finalContent.substring(faqMatch.index);
        return;
      }

      const sigMatch = finalContent.match(/\n---\s*\n\*\*Escrito com carinho/i);
      if (sigMatch && sigMatch.index !== undefined) {
        finalContent = finalContent.substring(0, sigMatch.index) + '\n\n' + additionalContent + '\n\n' + finalContent.substring(sigMatch.index);
        return;
      }

      finalContent = finalContent + '\n\n' + additionalContent;
    };

    // AUTO-COMPLETION: if content is too short, expand while respecting runtime budget
    if (finalWordCount < minimumWordCount) {
      const shortfall = minimumWordCount - finalWordCount;
      const elapsedMs = Date.now() - requestStartedAt;
      const runtimeBudgetExceeded = elapsedMs > 45000;

      console.log(`⚠️ Content too short: ${finalWordCount} words (min ${minimumWordCount}). Shortfall: ${shortfall} words. Elapsed: ${elapsedMs}ms`);

      if (isCarpentryTopic) {
        const carpentryExpansion = buildCarpentryHistoricalExpansion(topic);
        injectAdditionalContent(carpentryExpansion);
        finalWordCount = finalContent.split(/\s+/).filter(Boolean).length;
        console.log(`✅ Applied deterministic carpentry expansion. New word count: ${finalWordCount}`);
        
        // If still short after deterministic expansion, try AI expansion as fallback
        if (finalWordCount < minimumWordCount) {
          const remainingShortfall = minimumWordCount - finalWordCount;
          const currentElapsed = Date.now() - requestStartedAt;
          console.log(`⚠️ Still short after carpentry expansion: ${finalWordCount}/${minimumWordCount}. Trying AI expansion... (elapsed: ${currentElapsed}ms)`);
          
          if (currentElapsed < 55000) {
            try {
              const controller2 = new AbortController();
              const timeoutId2 = setTimeout(() => controller2.abort(), 25000);
              
              const expandResponse2 = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${OPENAI_API_KEY}`,
                  "Content-Type": "application/json",
                },
                signal: controller2.signal,
                body: JSON.stringify({
                  model: "gpt-4o-mini",
                  messages: [
                    {
                      role: "system",
                      content: `Você é Keven Costa Vieira, especialista em carpintaria americana. O artigo atual tem ${finalWordCount} palavras e precisa chegar em ${minimumWordCount}+ palavras.\n\nRetorne APENAS conteúdo adicional em markdown (seções com ## e ###) sobre aspectos técnicos da carpintaria americana: isolamento térmico, tipos de fixadores, códigos de construção, impermeabilização, eficiência energética.\nRegras: primeira pessoa, valores em USD, sem repetir conteúdo existente, sem FAQ, sem assinatura.`
                    },
                    {
                      role: "user",
                      content: `TEMA: "${topic}"\n\nAdicione aproximadamente ${Math.min(remainingShortfall + 300, 1200)} palavras de conteúdo técnico novo sobre carpintaria americana.`
                    }
                  ],
                  temperature: 0.8,
                  max_tokens: 6000,
                })
              });
              
              clearTimeout(timeoutId2);
              
              if (expandResponse2.ok) {
                const expandData2 = await expandResponse2.json();
                const additionalContent2 = expandData2.choices?.[0]?.message?.content?.trim();
                if (additionalContent2 && additionalContent2.length > 200) {
                  injectAdditionalContent(additionalContent2);
                  finalWordCount = finalContent.split(/\s+/).filter(Boolean).length;
                  console.log(`✅ AI carpentry expansion complete! New word count: ${finalWordCount}`);
                }
              }
            } catch (expandErr) {
              console.warn('⚠️ AI carpentry expansion failed (non-fatal):', expandErr);
            }
          }
        }
      } else if (runtimeBudgetExceeded) {
        console.warn('⚠️ Skipping OpenAI auto-expansion to avoid edge runtime timeout.');
      } else {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 25000);

          const expandResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: `Você é Keven Costa Vieira. O artigo atual está curto (${finalWordCount} palavras) e precisa chegar no mínimo em ${minimumWordCount} palavras.\n\nRetorne APENAS conteúdo adicional em markdown para ser inserido antes do FAQ.\nRegras: não repetir trechos existentes, manter primeira pessoa, manter USD, sem nova FAQ e sem nova assinatura.`
                },
                {
                  role: "user",
                  content: `TEMA: "${topic}"\n\nRESUMO DO ARTIGO ATUAL:\n${finalContent.substring(0, 5000)}\n\nAdicione aproximadamente ${Math.min(shortfall + 250, 900)} palavras de conteúdo novo e útil.`
                }
              ],
              temperature: 0.8,
              max_tokens: 5000,
            })
          });

          clearTimeout(timeoutId);

          if (expandResponse.ok) {
            const expandData = await expandResponse.json();
            const additionalContent = expandData.choices?.[0]?.message?.content?.trim();

            if (additionalContent && additionalContent.length > 200) {
              injectAdditionalContent(additionalContent);
              finalWordCount = finalContent.split(/\s+/).filter(Boolean).length;
              console.log(`✅ Auto-expansion complete! New word count: ${finalWordCount}`);
            } else {
              console.warn('⚠️ Expansion returned insufficient content, proceeding with original');
            }
          } else {
            console.error('⚠️ Expansion API call failed, proceeding with original content');
          }
        } catch (expandError) {
          console.error('⚠️ Auto-expansion error (non-fatal):', expandError);
        }
      }
    }

    const article = {
      title: validatedTitle,
      slug,
      excerpt: validatedExcerpt,
      category: categoryName,
      categorySlug,
      content: finalContent,
      tags: articleData.tags || [],
      keywords: articleData.keywords || '',
      readTime,
      externalLinks: validExternalLinks,
      mainSubject: imageData.mainSubject,
      visualContext: imageData.visualContext,
      galleryPrompts: imageData.galleryPrompts,
    };

    console.log(`✅ Article generated: ${article.title}`);
    console.log(`📊 Word count: ${finalWordCount} | Min required: ${minimumWordCount} | Read time: ${readTime}`);

    return new Response(
      JSON.stringify({ success: true, article }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error generating article:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
