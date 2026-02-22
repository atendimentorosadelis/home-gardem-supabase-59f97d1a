import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const OPENING_TEMPLATES = [
  "Existe algo de mágico quando",
  "Poucos momentos na vida são tão",
  "Houve um tempo em que",
  "Nas entrelinhas do cotidiano",
  "O silêncio de um lar revela",
  "Entre as paredes do que chamamos casa",
  "A verdade sobre transformar um espaço é",
  "Quando olho para um ambiente que ganha vida",
  "Algo desperta em nós quando",
  "O tempo ensinou que",
  "Debaixo de cada decisão de decorar há",
  "Certas escolhas carregam mais do que",
  "Na delicadeza dos detalhes mora",
  "Existe uma poesia silenciosa em",
  "O que realmente transforma um espaço não é",
  "Por trás de cada ambiente há",
  "A beleza das pequenas mudanças está em",
  "Alguns cantos de uma casa guardam",
  "Quando a luz atravessa um cômodo renovado",
  "O segredo que poucos percebem é",
  "Cada escolha de design carrega",
  "Na jornada de criar um lar",
  "O que torna um espaço especial é",
  "Às vezes, um simples arranjo revela",
  "A magia acontece quando entendemos que",
  "Entre cores e texturas existe",
  "O verdadeiro significado de um lar vem de",
  "Quando nos permitimos sonhar com",
  "A essência de um ambiente acolhedor está em",
  "Por trás de cada reforma bem-sucedida há",
  "O que realmente importa ao criar",
  "Nas escolhas que fazemos para nosso lar",
  "A transformação mais profunda acontece quando",
  "O que muitos não percebem sobre decoração é",
  "Entre o sonho e a realidade de um ambiente",
  "A verdadeira beleza de um espaço revela-se em",
  "Quando dedicamos atenção ao nosso lar",
  "O encanto de um ambiente bem planejado é",
  "Nas sutilezas de cada detalhe decorativo",
  "A arte de criar um espaço acolhedor começa quando",
  "Há uma sabedoria antiga em",
  "O coração de uma casa pulsa quando",
  "Cada parede conta uma história sobre",
  "A harmonia de um ambiente nasce de",
  "Existe uma conexão profunda entre",
  "O lar se transforma em refúgio quando",
  "A verdadeira elegância de um espaço vem de",
  "Quando permitimos que a luz dance pelos ambientes",
  "A alma de uma decoração está em",
  "O que diferencia um espaço comum de um extraordinário é",
];

const BANNED_PATTERNS = [
  /eu sei que/i, /pode parecer/i, /pesadelo/i, /não precisa ser/i,
  /você não está sozinho/i, /você não está sozinha/i, /nessa jornada/i,
  /assustador/i, /intimidador/i, /outro dia percebi/i, /estava pensando/i,
  /descubra/i, /transforme sua/i, /deixa sua pergunta/i, /ainda tem dúvidas/i,
  /reformar ou decorar/i, /difícil ou complicado/i,
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { theme, article_id } = await req.json();

    if (!theme || typeof theme !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Campo "theme" é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurada');

    const randomIndex = Math.floor(Math.random() * OPENING_TEMPLATES.length);
    const mandatoryOpening = OPENING_TEMPLATES[randomIndex];
    const uniqueSeed = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    console.log(`[EmotionalConclusion] Tema: "${theme}" | Template: "${mandatoryOpening}"`);

    const systemPrompt = `Você é um escritor literário de elite, autor de best-sellers com domínio profundo da escrita emocional.

REGRA CRÍTICA - ABERTURA OBRIGATÓRIA:
Você DEVE iniciar o texto com EXATAMENTE estas palavras: "${mandatoryOpening}"

EXPRESSÕES PROIBIDAS: "Eu sei que", "pode parecer", "pesadelo", "você não está sozinho/sozinha", "nessa jornada", "assustador", "intimidador", "Descubra", "Transforme sua"

ESTILO: sensibilidade literária, metáforas, máximo 200 palavras, português brasileiro elegante, NÃO mencione IA.`;

    const userPrompt = `[Seed: ${uniqueSeed}]\n\nTEMA: "${theme}"\n\nComece EXATAMENTE com "${mandatoryOpening}" e escreva uma conclusão emocional única e poética.`;

    const containsBannedPattern = (text: string): boolean => {
      return BANNED_PATTERNS.some(pattern => pattern.test(text));
    };

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const generateText = async (isRetry: boolean = false): Promise<string> => {
      const retryAddendum = isRetry
        ? `\n\nATENÇÃO: A geração anterior continha frases proibidas. Comece com "${mandatoryOpening}".`
        : '';

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt + retryAddendum },
              ],
              temperature: isRetry ? 0.99 : 0.95,
              max_tokens: 800,
            }),
          });

          if (response.status === 429) {
            await delay(Math.pow(2, attempt) * 1000);
            continue;
          }
          if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);

          const data = await response.json();
          return data.choices?.[0]?.message?.content?.trim() || '';
        } catch (err) {
          if (attempt < 3) await delay(Math.pow(2, attempt) * 1000);
          else throw err;
        }
      }
      throw new Error('Failed after max retries');
    };

    let emotionalText = '';
    for (let attempts = 0; attempts < 4; attempts++) {
      emotionalText = await generateText(attempts > 0);
      if (!containsBannedPattern(emotionalText)) break;
    }

    if (containsBannedPattern(emotionalText)) {
      const sentences = emotionalText.split(/(?<=[.!?])\s+/);
      const cleanSentences = sentences.filter(s => !containsBannedPattern(s));
      emotionalText = `${mandatoryOpening} ${theme.toLowerCase()}, descobrimos que os pequenos detalhes são os que mais importam. ${cleanSentences.slice(0, 4).join(' ')}`;
    }

    if (!emotionalText) throw new Error('Falha ao gerar texto emocional');

    // Save to database if article_id is provided
    let saved = false;
    if (article_id) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Append conclusion to article body
        const { data: article } = await supabase
          .from('content_articles')
          .select('body')
          .eq('id', article_id)
          .maybeSingle();

        if (article) {
          const updatedBody = (article.body || '') + `\n\n---\n\n${emotionalText}`;
          await supabase
            .from('content_articles')
            .update({ body: updatedBody })
            .eq('id', article_id);
          saved = true;
        }
      } catch (saveError) {
        console.error('[EmotionalConclusion] Save error:', saveError);
      }
    }

    return new Response(
      JSON.stringify({ emotional_text: emotionalText, saved, article_id: article_id || null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[EmotionalConclusion] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
