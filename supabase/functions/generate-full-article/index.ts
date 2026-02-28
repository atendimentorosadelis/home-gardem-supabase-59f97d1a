import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
];

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

async function validateUrl(url: string): Promise<boolean> {
  try {
    if (!url || !url.startsWith('http')) {
      return false;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkValidator/1.0)',
      },
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
    
    const fallbacks = getRandomFallbackLinks(10); // Get more than needed, will filter
    for (const fallback of fallbacks) {
      if (validLinks.length >= minRequired) break;
      
      try {
        const domain = new URL(fallback.url).hostname.replace('www.', '');
        if (!existingDomains.has(domain)) {
          // Validate fallback too
          const isValid = await validateUrl(fallback.url);
          if (isValid) {
            validLinks.push(fallback);
            existingDomains.add(domain);
            console.log(`Added fallback link: ${fallback.text}`);
          }
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

function generateFallbackPrompts(mainSubject: string, visualContext: string): string[] {
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

function validateAndSanitizeImageData(data: Partial<ImageMetadata>): ImageMetadata {
  let mainSubject = data.mainSubject || '';
  let visualContext = data.visualContext || '';
  let galleryPrompts = data.galleryPrompts || [];

  if (!mainSubject || mainSubject.trim().length < 5) {
    mainSubject = 'home design element';
    console.warn('[ImageValidation] Invalid mainSubject, using fallback');
  }

  if (!visualContext || visualContext.trim().length < 5) {
    const archKeywords = ['facade', 'exterior', 'colonial', 'industrial', 'modern building', 'neolithic', 'european', 'nordic', 'neoclassical', 'architecture'];
    const isArch = archKeywords.some(k => mainSubject.toLowerCase().includes(k));
    visualContext = isArch
      ? 'building exterior facade, street view, clear sky, natural daylight'
      : 'modern home interior with natural lighting';
    console.warn('[ImageValidation] Invalid visualContext, using fallback:', visualContext);
  }

  const validation = validateGalleryPrompts(galleryPrompts, mainSubject);
  
  if (!validation.valid) {
    console.warn('[ImageValidation] Invalid galleryPrompts:', validation.errors);
    console.warn('[ImageValidation] Generating fallback prompts...');
    galleryPrompts = generateFallbackPrompts(mainSubject, visualContext);
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

    const { topic } = await req.json();
    
    if (!topic) {
      throw new Error("Topic is required");
    }

    console.log(`Generating full article for topic: ${topic}`);

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

# FORMATO DE RESPOSTA (CRÍTICO)

Retorne APENAS JSON válido (sem markdown code blocks):
{
  "title": "Título acolhedor e interessante (máximo 70 caracteres)",
  "excerpt": "Resumo variado e pessoal",
  "category": "DEVE ser EXATAMENTE uma destas: Sala, Sala de Jantar, Lareira, Área Gourmet, Quarto, Banheiro, Escritório, Cozinha, Varanda, Área de Serviço, Piscina, Dicas de Pintura, Jardim, Decoração de Jardim, Cuidados com Plantação, Jardim Vertical, Suculentas e Cactos, Horta de Ervas, Flores Ornamentais, Paisagismo, Hidroponia, Jardim Sustentável, Decoração de Halloween, Nomes e Cuidados Plantas e Flores, Hortas, Ervas e Cuidados, Colonial, Industrial, Moderno, Neolítico, Europeu, Nórdico, Neo Clássico",
  "tags": ["5", "a", "7", "tags"],
  "keywords": "palavras-chave para SEO separadas por vírgula",
  "content": "## Introdução\\n\\n... CONTEÚDO COMPLETO COM 2200+ PALAVRAS ...",
  "externalLinks": [{"text": "Descriptive name of US authority site", "url": "https://real-us-site.com/relevant-page"}],
  "mainSubject": "elemento principal em INGLÊS",
  "visualContext": "ambiente completo em INGLÊS",
  "galleryPrompts": ["6 prompts do MESMO CÔMODO em ângulos diferentes"]
}

⚠️ TODOS os 6 gallery prompts devem mostrar O MESMO CÔMODO!

🎲 NÚMERO SORTEADO PARA EXCERPT: ${Math.floor(Math.random() * 25) + 1}

❌ PROIBIDO NO EXCERPT:
- "Outro dia percebi" - BANIDO
- "Neste artigo" - BANIDO
- "Descubra como" - BANIDO

- content DEVE OBRIGATORIAMENTE incluir "## Perguntas Frequentes" com 8-12 perguntas numeradas em negrito`;

    const isPlantFlowerNamesTopic = /nomes.*cuidados.*plantas|nomes.*flores|cuidados.*plantas.*flores/i.test(topic.toLowerCase());

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
- O artigo deve ser um GUIA PRÁTICO e PESSOAL sobre técnicas de pintura, acabamentos e texturas para casa.
- O Keven deve falar sobre suas experiências REAIS pintando paredes, ajudando a mãe a renovar a casa, experimentando texturas.
- NÃO mencione "PUC Minas" ou "faculdade" na introdução — fale sobre experiência prática de pintura em casa.

## REGRA CRÍTICA DE TÍTULO E RESUMO (DICAS DE PINTURA):
⚠️ O título DEVE ser PESSOAL, ÍNTIMO e CONVERSACIONAL — como se o Keven estivesse contando para um amigo.
❌ PROIBIDO títulos formais como: "Pinturas de Parede: Dicas para Transformar sua Casa", "Guia Completo de Pintura", "Tudo sobre Tintas e Texturas"
✅ EXEMPLOS CORRETOS de títulos:
  - "Eu pintei minha parede de cimento queimado e quase chorei de emoção"
  - "Aquele fim de semana que eu e minha mãe renovamos a sala inteira"
  - "Confesso: eu tinha MEDO de pegar no rolo de pintura"
  - "O dia que aprendi a fazer grafiato sozinho (e errei feio na primeira vez)"
  - "Verniz na madeira velha: como dei vida nova ao móvel da minha avó"
  - "Minha parede estava horrível — até eu aprender esse truque com a tinta"

⚠️ O resumo (excerpt) DEVE ser uma CONVERSA DIRETA com o leitor, como se falasse olhando nos olhos.
❌ PROIBIDO resumos formais como: "Explore o mundo das tintas e texturas", "Aprenda técnicas profissionais"
✅ EXEMPLOS CORRETOS de resumos:
  - "Vem comigo que vou te mostrar como eu transformei minha sala gastando pouco e com as minhas próprias mãos."
  - "Sabe aquela parede sem graça? Eu mudei a cara dela num fim de semana — e você também consegue."
  - "Peguei o rolo, a tinta, e fui com tudo. Te conto cada detalhe pra você não errar como eu errei."

## CONTEÚDO OBRIGATÓRIO (TODOS estes tópicos devem aparecer no artigo):
  * COMO PREPARAR A PAREDE: lixar, aplicar massa corrida, fundo preparador, selador — passo a passo detalhado
  * TIPOS DE TINTA: acrílica, látex, esmalte sintético, tinta epóxi — diferenças, vantagens e quando usar cada uma
  * COMO PINTAR UMA PAREDE: técnica correta com rolo, pincel e trincha — de cima para baixo, movimentos em W, quantas demãos
  * EFEITO CIMENTO QUEIMADO: como fazer passo a passo, materiais necessários (argamassa, desempenadeira, selador), dicas de acabamento
  * GRAFIATO/TEXTURA: como aplicar grafiato na parede, tipos de textura (rústica, lisa, riscada), ferramentas necessárias (desempenadeira dentada, rolo texturizado)
  * VERNIZ PARA MADEIRA: tipos de verniz (marítimo, copal, poliuretano), como lixar e preparar a madeira, quantas demãos, tempo de secagem entre demãos
  * PINTURA DECORATIVA: técnicas como esponjado, pátina, stencil, degradê, parede geométrica
  * FERRAMENTAS ESSENCIAIS: tipos de rolo (lã, espuma, anti-gota), pincéis, bandejas, fita crepe, lona de proteção
  * CÁLCULO DE TINTA: como calcular a quantidade de tinta necessária por metro quadrado
  * CORES E COMBINAÇÕES: como escolher cores, usar o círculo cromático, combinações que funcionam
  * ERROS COMUNS: pintar sem preparar a parede, não esperar secagem entre demãos, economizar na qualidade da tinta
  * VALORES E ESTIMATIVAS EM DÓLARES (USD): preço médio de tintas, massa corrida, verniz, ferramentas — custo por cômodo
   * TEMPO ESTIMADO: quanto tempo leva para pintar cada cômodo, secar entre demãos

⚠️ REGRA OBRIGATÓRIA DE MOEDA (DICAS DE PINTURA):
- TODOS os valores monetários DEVEM usar DÓLARES AMERICANOS (USD) com o símbolo "$".
- ❌ PROIBIDO usar "R$", "reais", "BRL" ou qualquer referência à moeda brasileira.
- ✅ Use APENAS "$" seguido do valor em dólares. Exemplos: "$15", "$30", "$120", "$5 to $10".
- Se precisar dar faixas de preço, use: "$20 to $50", "$100 to $200".
- NÃO converta de real para dólar — pense diretamente em preços do mercado americano (Home Depot, Lowe's).

- mainSubject DEVE ser em INGLÊS: "wall painting techniques and decorative textures"
- visualContext DEVE ser: "home interior wall being painted, paint supplies, colorful paint cans, roller and brushes"
- galleryPrompts DEVEM mostrar 6 ângulos DIFERENTES de técnicas de pintura:
  1. Pessoa aplicando tinta com rolo em parede (paint roller applying fresh color on interior wall)
  2. Close-up de efeito cimento queimado (close-up of burnt cement polished concrete wall texture finish)
  3. Aplicação de grafiato/textura (grafiato textured wall application with trowel, decorative plaster)
  4. Verniz sendo aplicado em madeira (wood varnish application with brush, glossy protective coating on wood surface)
  5. Ferramentas e latas de tinta organizadas (painting supplies arrangement, colorful paint cans, rollers, brushes, tape)
  6. Parede com pintura decorativa geométrica (geometric decorative wall painting, modern accent wall design, tape patterns)
- category DEVE ser "Dicas de Pintura"

⚠️ TAMANHO MÍNIMO REFORÇADO PARA DICAS DE PINTURA:
- Este tema exige MUITOS detalhes técnicos. O artigo DEVE ter NO MÍNIMO 2.500 palavras.
- Cada seção técnica (cimento queimado, grafiato, verniz, preparação, etc.) deve ter NO MÍNIMO 200 palavras cada.
- NÃO resuma, NÃO pule etapas, NÃO encurte. O leitor precisa de um GUIA COMPLETO que ele possa seguir passo a passo.
- Inclua medidas reais (metros quadrados, litros de tinta, gramas de massa), tempos de secagem em horas, e dicas de economia.
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
${plantFlowerInstructions}${vegetableHerbInstructions}${architectureInstructions}${paintingInstructions}`;

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
      /guia\s+completo/i, /guia\s+definitivo/i, /dicas\s+essenciais/i,
      /dicas\s+imperdíveis/i, /tudo\s+sobre/i, /segredos?\s+(para|de|do|da)/i, /o\s+segredo/i,
    ];

    const BANNED_TITLE_PHRASES = [
      'guia completo', 'guia definitivo', 'dicas essenciais', 'dicas imperdíveis',
      'tudo sobre', 'o segredo', 'transforme sua', 'descubra como', 'aprenda a',
    ];

    function validateAndSanitizeTitle(titleArg: string, topicArg: string): string {
      if (!titleArg || typeof titleArg !== 'string' || titleArg.trim().length < 10) {
        return generateFallbackTitle(topicArg);
      }
      const cleanTitle = titleArg.trim();
      const lowerTitle = cleanTitle.toLowerCase();
      
      for (const phrase of BANNED_TITLE_PHRASES) {
        if (lowerTitle.includes(phrase)) return generateFallbackTitle(topicArg);
      }
      for (const pattern of BANNED_TITLE_PATTERNS) {
        if (pattern.test(cleanTitle)) return generateFallbackTitle(topicArg);
      }
      if (cleanTitle.length > 75) return cleanTitle.substring(0, 72) + '...';
      return cleanTitle;
    }

    function generateFallbackTitle(topicArg: string): string {
      const topicWord = topicArg.split(/[\s-]+/)[0];
      const capitalizedTopic = topicWord.charAt(0).toUpperCase() + topicWord.slice(1).toLowerCase();
      const genericTemplates = [
        `${capitalizedTopic}: O Que Aprendi na Prática`,
        `${capitalizedTopic}: Ideias que Funcionam de Verdade`,
        `${capitalizedTopic} em Casa: Minha Experiência`,
        `${capitalizedTopic}: Como Fazer Sem Gastar Fortuna`,
      ];
      return genericTemplates[Math.floor(Math.random() * genericTemplates.length)];
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
    const validatedTitle = validateAndSanitizeTitle(articleData.title, topic);
    const validatedExcerpt = validateAndSanitizeExcerpt(articleData.excerpt, validatedTitle, topic);
    
    // PRIORITY 1: Infer category from the TOPIC (most reliable - user chose it)
    let categoryMatch: typeof categories[0] | undefined = undefined;
    // topicLower already declared above (line 578)
    
    // MOST SPECIFIC patterns checked FIRST - order matters!
    // 1. Multi-word specific themes (must come before generic single-word matches)
    if (/hortas.*ervas.*cuidados|hortas.*cuidados|cuidados.*hortalic|hortas.*ervas|jardim.*hortas/i.test(topicLower)) {
      categoryMatch = categories.find(c => c.slug === 'hortas-ervas-cuidados');
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

    const imageData = validateAndSanitizeImageData({
      mainSubject: articleData.mainSubject,
      visualContext: articleData.visualContext,
      galleryPrompts: articleData.galleryPrompts,
    });

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

    const minimumWordCount = isPaintingTopic ? 2500 : 2200;
    const finalWordCount = finalContent.split(/\s+/).filter(Boolean).length;

    if (finalWordCount < minimumWordCount) {
      const shortfall = minimumWordCount - finalWordCount;
      throw new Error(
        `Conteúdo insuficiente: ${finalWordCount} palavras geradas, mínimo exigido é ${minimumWordCount} (faltam ${shortfall}). Regenerando é obrigatório.`
      );
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
