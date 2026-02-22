import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const categories = [
  { name: 'Decoração', slug: 'decoracao' },
  { name: 'Design Interno', slug: 'design-interno' },
  { name: 'Jardim', slug: 'jardim' },
  { name: 'Arquitetura', slug: 'arquitetura' },
  { name: 'Plantas de Interior', slug: 'plantas-interior' },
  { name: 'DIY e Projetos', slug: 'diy-projetos' },
  { name: 'Sustentabilidade', slug: 'sustentabilidade' },
  { name: 'Móveis e Organização', slug: 'moveis-organizacao' },
  { name: 'Tendências', slug: 'tendencias' },
  { name: 'Iluminação', slug: 'iluminacao' },
  { name: 'Datas Comemorativas', slug: 'datas-comemorativas' },
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
    if (!url || !url.startsWith('http')) return false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LinkValidator/1.0)' },
      redirect: 'follow',
    });
    clearTimeout(timeoutId);
    return response.status >= 200 && response.status < 400;
  } catch {
    return false;
  }
}

const MANDATORY_EXTERNAL_LINKS = [
  { text: "Casa Vogue Brasil", url: "https://casavogue.globo.com" },
  { text: "ArchDaily Brasil", url: "https://www.archdaily.com.br" },
  { text: "Leroy Merlin", url: "https://www.leroymerlin.com.br" },
];

const FALLBACK_EXTERNAL_LINKS = [
  { text: "Architectural Digest Design Guide", url: "https://www.architecturaldigest.com/gallery/best-home-design-ideas" },
  { text: "Houzz Home Design Ideas", url: "https://www.houzz.com/photos" },
  { text: "The Spruce Home Improvement", url: "https://www.thespruce.com/home-improvement-and-repair-4127986" },
  { text: "HGTV Design Inspiration", url: "https://www.hgtv.com/design" },
  { text: "Better Homes & Gardens", url: "https://www.bhg.com/home-improvement/" },
];

async function validateExternalLinks(
  links: Array<{ text: string; url: string }>,
  minRequired: number = 3
): Promise<Array<{ text: string; url: string }>> {
  let validLinks: Array<{ text: string; url: string }> = [];

  for (const mandatory of MANDATORY_EXTERNAL_LINKS) {
    const isValid = await validateUrl(mandatory.url);
    if (isValid) validLinks.push(mandatory);
  }

  if (links && links.length > 0) {
    const existingUrls = new Set(validLinks.map(l => l.url.toLowerCase()));
    const validationResults = await Promise.all(
      links.map(async (link) => {
        if (existingUrls.has(link.url.toLowerCase())) return { link, isValid: false };
        const isValid = await validateUrl(link.url);
        return { link, isValid };
      })
    );
    validLinks = [...validLinks, ...validationResults.filter(r => r.isValid).map(r => r.link)];
  }

  if (validLinks.length < minRequired) {
    const existingUrls = new Set(validLinks.map(l => l.url.toLowerCase()));
    for (const fallback of FALLBACK_EXTERNAL_LINKS) {
      if (validLinks.length >= minRequired) break;
      if (!existingUrls.has(fallback.url.toLowerCase())) {
        validLinks.push(fallback);
        existingUrls.add(fallback.url.toLowerCase());
      }
    }
  }

  return validLinks;
}

interface ImageMetadata {
  mainSubject: string;
  visualContext: string;
  galleryPrompts: string[];
}

function generateFallbackPrompts(mainSubject: string, visualContext: string): string[] {
  const cameraAngles = [
    { angle: 'wide-angle front view establishing shot', composition: 'hero composition showing entire space, 16:9 cinematic framing' },
    { angle: 'medium shot from left side', composition: 'showing furniture arrangement and wall details' },
    { angle: 'close-up macro shot', composition: 'focusing on textures, materials and decorative details' },
    { angle: 'shot from right side', composition: 'alternative perspective revealing hidden corner elements' },
    { angle: 'low angle dramatic shot from floor level', composition: 'looking upward to emphasize height and ceiling' },
    { angle: 'high angle bird eye overview', composition: 'showing full spatial layout and floor design' },
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
    mainSubject = 'home interior design element';
  }
  if (!visualContext || visualContext.trim().length < 5) {
    visualContext = 'modern home interior with natural lighting';
  }

  if (!Array.isArray(galleryPrompts) || galleryPrompts.length !== 6) {
    galleryPrompts = generateFallbackPrompts(mainSubject, visualContext);
  }

  while (galleryPrompts.length < 6) {
    galleryPrompts.push(
      `${mainSubject}, detail shot ${galleryPrompts.length + 1}, ${visualContext}, natural lighting, ultra realistic, professional photography, no text, no words, no watermarks`
    );
  }
  galleryPrompts = galleryPrompts.slice(0, 6);

  return { mainSubject, visualContext, galleryPrompts };
}

function getCurrentDateFormatted(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo'
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
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const { topic } = await req.json();
    if (!topic) throw new Error("Topic is required");

    console.log(`Generating full article for topic: ${topic}`);

    const currentDate = getCurrentDateFormatted();
    const introTypes = ['A', 'B', 'C', 'D', 'E', 'F'];
    const randomIntroType = introTypes[Math.floor(Math.random() * introTypes.length)];

    const systemPrompt = `# PERSONA DO AUTOR - KEVEN COSTA VIEIRA

Você é **Keven Costa Vieira**, estudante de Arquitetura na PUC Minas Gerais, no 7º período.
Você é um ESCRITOR BEST-SELLER premiado que escreve artigos tão envolventes que fazem os leitores se emocionarem até as lágrimas.

## TOM DE VOZ OBRIGATÓRIO
Escreva SEMPRE em 1ª pessoa. Você é vulnerável e humano.

## FILTRO ANTI-IA (PROIBIDO)
❌ NUNCA use: Descubra, Transforme, Veja, O segredo, Mude, Confira, Neste artigo, Imperdível, Incrível, Perfeito, Maravilhoso

# ESTRUTURA DO ARTIGO

## 1. INTRODUÇÃO CONFESSIONAL (400-500 palavras)
🎲 NÚMERO SORTEADO: ${Math.floor(Math.random() * 40) + 1}
Use a frase correspondente ao número sorteado como abertura.

🎲 DESENVOLVIMENTO - Use o TIPO ${randomIntroType}:
- TIPO A - CENA DO LABORATÓRIO
- TIPO B - ERRO CONFESSIONAL DETALHADO
- TIPO C - PERGUNTA DO PROFESSOR
- TIPO D - DESCOBERTA EM CAMPO
- TIPO E - HISTÓRIA DA FAMÍLIA
- TIPO F - MEMÓRIA AFETIVA

## 2. SEÇÕES TEMÁTICAS APROFUNDADAS (1200-1500 palavras total)
6-8 seções detalhadas sobre ${topic}. Inclua links de autoridade naturalmente no texto.

## 3. TABELA COMPARATIVA OBRIGATÓRIA (mínimo 7 linhas)
| O que todo mundo faz (Errado) | A Escolha Inteligente do Keven |

## 4. PASSO A PASSO PRÁTICO (400-500 palavras) - 8-10 passos

## 5. DICAS PRÁTICAS (300-400 palavras) - 10-12 dicas

## 6. ERROS COMUNS A EVITAR (350-450 palavras) - 6-8 erros

## 7. QUANTO CUSTA? VALORES EM REAIS (200-300 palavras)

## 8. FAQ - PERGUNTAS FREQUENTES (400-500 palavras)
Formato: 1. **Pergunta?** Resposta. (8-12 perguntas)

## 9. ENCERRAMENTO BREVE (50-80 palavras) - NÃO gere conclusão emocional

## 10. ASSINATURA: Keven Costa Vieira - PUC Minas - ${currentDate}

# TAMANHO: MÍNIMO 2.200 palavras

# FORMATO DE RESPOSTA - JSON válido:
{
  "title": "Título (máximo 70 caracteres)",
  "excerpt": "Resumo variado (20-40 palavras)",
  "category": "Uma das categorias",
  "tags": ["5-7 tags"],
  "keywords": "palavras-chave SEO",
  "content": "## Introdução\\n\\n... CONTEÚDO COMPLETO ...",
  "externalLinks": [{"text": "Nome", "url": "https://url.com"}],
  "mainSubject": "elemento principal em INGLÊS",
  "visualContext": "ambiente em INGLÊS",
  "galleryPrompts": ["6 prompts em INGLÊS do MESMO cômodo em ângulos diferentes"]
}`;

    const userPrompt = `Crie um artigo PROFUNDO e ENVOLVENTE sobre: "${topic}"
Blog homegardenmanual.com - casa e jardim. Mínimo 2.200 palavras.
Inclua "## Perguntas Frequentes" com 8-12 perguntas numeradas em negrito.
NÃO gere conclusão emocional.`;

    console.log("Calling OpenAI API...");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.85,
        max_tokens: 16000,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorText}`);
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("No content was generated");

    console.log("Raw response content:", content.substring(0, 500));

    let articleData;
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) cleanContent = cleanContent.slice(7);
      if (cleanContent.startsWith('```')) cleanContent = cleanContent.slice(3);
      if (cleanContent.endsWith('```')) cleanContent = cleanContent.slice(0, -3);
      cleanContent = cleanContent.trim();

      try {
        articleData = JSON.parse(cleanContent);
      } catch {
        const firstBrace = cleanContent.indexOf('{');
        const lastBrace = cleanContent.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          articleData = JSON.parse(cleanContent.substring(firstBrace, lastBrace + 1));
        } else {
          throw new Error("No JSON object found in response");
        }
      }
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError);
      throw new Error("Failed to parse generated article");
    }

    // Validate content
    const contentWordCount = articleData.content ? articleData.content.split(/\s+/).length : 0;
    console.log(`Word count: ${contentWordCount}`);

    const categoryMatch = categories.find(c => c.name.toLowerCase() === articleData.category?.toLowerCase());
    const categorySlug = categoryMatch?.slug || 'decoracao';
    const categoryName = categoryMatch?.name || 'Decoração';
    const slug = generateSlug(articleData.title || topic);
    const readTime = calculateReadTime(articleData.content || '');

    const rawExternalLinks = articleData.externalLinks || [];
    const validExternalLinks = await validateExternalLinks(rawExternalLinks, 3);

    const imageData = validateAndSanitizeImageData({
      mainSubject: articleData.mainSubject,
      visualContext: articleData.visualContext,
      galleryPrompts: articleData.galleryPrompts,
    });

    // Inject FAQ if missing
    let finalContent = articleData.content || '';
    const hasFAQ = /##\s*(FAQ|Perguntas\s+Frequentes)/i.test(finalContent);
    if (!hasFAQ) {
      const topicLower = topic.toLowerCase();
      finalContent += `\n\n## Perguntas Frequentes\n\n1. **Qual é o orçamento ideal para ${topicLower}?**\n\nDepende muito do tamanho do projeto. É possível começar com R$ 500 para projetos menores.\n\n2. **Quanto tempo leva?**\n\nProjetos simples podem ser concluídos em um fim de semana.\n\n3. **Preciso contratar um profissional?**\n\nPara projetos básicos, você mesmo pode fazer. Para instalações elétricas ou hidráulicas, contrate profissionais.\n\n4. **Quais materiais são mais recomendados?**\n\nMateriais de qualidade intermediária costumam oferecer o melhor custo-benefício.\n\n5. **Como economizar sem perder qualidade?**\n\nCompare preços em pelo menos 3 lojas diferentes e aproveite promoções sazonais.\n\n6. **Vale a pena fazer eu mesmo?**\n\nSe você tem habilidades manuais e tempo, pode economizar bastante.\n\n7. **Quais são os erros mais comuns?**\n\nNão medir corretamente, economizar em materiais essenciais e pular etapas de preparação.\n\n8. **Como saber se o resultado vai ficar bom?**\n\nFaça um projeto visual antes de começar, mesmo que simples.\n`;
    }

    const article = {
      title: articleData.title || topic,
      slug,
      excerpt: articleData.excerpt || `Artigo sobre ${topic}`,
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
    console.log(`📊 Word count: ${contentWordCount} | Read time: ${readTime}`);

    return new Response(
      JSON.stringify({ success: true, article }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error generating article:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
