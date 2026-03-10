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
    const { title, excerpt, body, category, type } = await req.json();

    if (!title && !body) {
      return new Response(
        JSON.stringify({ error: 'Título ou conteúdo do artigo é necessário' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const isTitle = type === 'title';
    const isBoth = type === 'both';

    // Random seed for variety
    const randomSeed = Math.floor(Math.random() * 100);
    const toneVariations = [
      'confessional e íntimo, como se estivesse contando um segredo para o melhor amigo',
      'nostálgico e poético, evocando memórias de infância e sensações de lar',
      'bem-humorado e leve, com um toque de ironia carinhosa do dia a dia',
      'emocionado e vulnerável, como quem acabou de ter uma epifania',
      'curioso e empolgado, como um estudante que acabou de fazer uma descoberta',
    ];
    const selectedTone = toneVariations[randomSeed % toneVariations.length];

    const kevenPersona = `Você é Keven Costa Vieira, estudante de Arquitetura na PUC Minas (7º período). 
Seu tom é ${selectedTone}.
Você escreve como gente de verdade — com imperfeições, emoções e personalidade.`;

    const bannedPhrases = `
❌ PROIBIDO usar estas palavras/padrões nos títulos e resumos:
- "Criando o/a ... dos Seus Sonhos" - BANIDO PERMANENTEMENTE (padrão mais repetido)
- "Descubra", "Transforme", "Guia Completo", "Guia Definitivo", "Dicas Essenciais"
- "Dicas Imperdíveis", "Tudo Sobre", "O Segredo", "Confira", "Veja"
- "Neste artigo", "Aprenda a", "Conheça", "Explore"
- "Como Criar", "Como Montar" no início do título
- Títulos genéricos tipo "X Dicas para Y" ou "Como Fazer X: Guia Completo"
- Qualquer coisa que pareça gerada por IA ou clickbait
- Títulos que poderiam servir para QUALQUER tema (devem ser ESPECÍFICOS)

✅ USE linguagem que soa HUMANA e REAL:
- Confissões pessoais: "Eu errei feio com...", "Minha mãe tinha razão sobre..."
- Emoções genuínas: "Chorei quando vi...", "Aquela sensação gostosa de..."
- Histórias: "O dia que...", "Quando finalmente entendi..."
- Perguntas reais: "Será que só eu...?", "Por que ninguém fala de...?"
- Opiniões fortes: "Cansei de ver...", "Isso mudou tudo pra mim"
- Detalhes específicos: mencione algo CONCRETO do tema, não genérico`;

    let systemPrompt: string;
    let userMessage: string;

    if (isTitle) {
      systemPrompt = `${kevenPersona}

Gere exatamente 5 títulos COMPLETAMENTE DIFERENTES entre si para o artigo abaixo.
${bannedPhrases}

REGRAS DE VARIEDADE (cada título DEVE usar um estilo diferente):
1. 🫂 CONFISSÃO PESSOAL — começa com "eu", conta algo íntimo (ex: "Eu Quase Desisti de Ter Plantas Até Que...")
2. 🤔 PERGUNTA PROVOCATIVA — questiona algo do senso comum (ex: "Será Que Sua Cozinha Está Te Fazendo Mal?")
3. 💡 DESCOBERTA EMOCIONAL — momento eureka (ex: "O Dia Que Entendi Por Que Minha Avó Amava o Jardim")
4. 🎯 OPINIÃO FORTE — posicionamento claro (ex: "Cansei de Ver Varandas Sem Vida: Aqui Está o Que Funciona")
5. 🌿 SENSORIAL/POÉTICO — evoca sensações (ex: "Aquele Cheiro de Terra Molhada Que Faz a Gente Sorrir")

Cada título deve ter entre 45 e 70 caracteres.
O número sorteado é ${randomSeed} — use-o para variar a criatividade.

Retorne APENAS JSON: { "suggestions": ["título 1", "título 2", "título 3", "título 4", "título 5"] }`;
      userMessage = `Título atual: ${title}\nCategoria: ${category || 'decoração'}\n${excerpt ? `Resumo: ${excerpt}` : ''}\n${body ? `Primeiros parágrafos: ${body.substring(0, 800)}` : ''}`;
    } else if (isBoth) {
      systemPrompt = `${kevenPersona}

Gere exatamente 5 combinações de título + resumo COMPLETAMENTE DIFERENTES entre si.
${bannedPhrases}

REGRAS PARA TÍTULOS (cada um com estilo diferente):
1. 🫂 CONFISSÃO PESSOAL — tom íntimo, vulnerável
2. 🤔 PERGUNTA que gera curiosidade genuína
3. 💡 MOMENTO DE DESCOBERTA pessoal
4. 🎯 OPINIÃO FORTE e autêntica
5. 🌿 SENSORIAL — evoca cheiros, texturas, sensações

Títulos: 45-70 caracteres.

REGRAS PARA RESUMOS:
- Cada resumo deve COMPLEMENTAR o estilo do título
- Tom conversacional como se estivesse mandando um áudio para um amigo
- Entre 100 e 155 caracteres
- Deve provocar um "preciso ler isso" emocional, não racional
- NUNCA começar com "Neste artigo" ou "Descubra"

O número sorteado é ${randomSeed}.

Retorne APENAS JSON:
{ "suggestions": [{ "title": "título 1", "excerpt": "resumo 1" }, ...] }`;
      userMessage = `Título atual: ${title}\nResumo atual: ${excerpt || 'Sem resumo'}\nCategoria: ${category || 'decoração'}\n${body ? `Primeiros parágrafos: ${body.substring(0, 800)}` : ''}`;
    } else {
      // excerpt only
      systemPrompt = `${kevenPersona}

Gere exatamente 5 resumos (excerpts) COMPLETAMENTE DIFERENTES para o artigo abaixo.
${bannedPhrases}

CADA RESUMO deve usar um tom diferente:
1. 🫂 CONFESSIONAL — "Vou ser sincero: eu errei muito até..."
2. 💬 CONVERSA DE AMIGO — casual, com gírias leves
3. 🎭 EMOCIONAL — toca no coração, fala de memórias e sentimentos
4. 🔥 DIRETO E FORTE — opinião sem rodeios
5. ✨ CURIOSO — levanta uma questão que faz pensar

Cada resumo deve:
- Ter entre 100 e 155 caracteres
- Complementar o título "${title}"
- Soar como uma pessoa real falando, não um robô
- Fazer o leitor sentir vontade de ler o artigo

O número sorteado é ${randomSeed}.

Retorne APENAS JSON: { "suggestions": ["resumo 1", "resumo 2", "resumo 3", "resumo 4", "resumo 5"] }`;
      userMessage = `Título: ${title}\nResumo atual: ${excerpt || 'Sem resumo'}\nCategoria: ${category || 'decoração'}\n${body ? `Primeiros parágrafos: ${body.substring(0, 800)}` : ''}`;
    }

    console.log(`[generate-title-suggestions] Generating ${type} suggestions...`);

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
          { role: 'user', content: userMessage }
        ],
        temperature: 0.95,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(content);
    console.log(`[generate-title-suggestions] Generated ${parsed.suggestions?.length} suggestions`);

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating suggestions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate suggestions' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
