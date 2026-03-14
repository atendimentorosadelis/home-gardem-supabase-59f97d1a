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
❌ PADRÕES PERMANENTEMENTE BANIDOS (NUNCA use estas estruturas):
- "Criando o/a ... dos Seus Sonhos" — BANIDO PERMANENTEMENTE
- "Será Que Seu/Sua ... Está Te Sabotando?" — BANIDO
- "Transformando Seu/Sua ..." — BANIDO
- "Guia Completo/Definitivo" — BANIDO
- "Dicas Essenciais/Imperdíveis/Incríveis" — BANIDO
- "Descubra Como", "Tudo Sobre", "O Segredo", "Confira", "Veja" — BANIDO
- "Como Criar/Montar ..." — BANIDO
- "A Verdade Que Ninguém Conta" — BANIDO
- "O Dia Que Entendi ..." — BANIDO
- "O Dia Que Eu Aprendi ..." — BANIDO PERMANENTEMENTE
- "O Dia Que ..." (qualquer variação) — BANIDO PERMANENTEMENTE
- "Confesso Que ..." — BANIDO PERMANENTEMENTE
- "Eu Nunca Imaginei Que ..." — BANIDO PERMANENTEMENTE
- "Cansei de Ver ... Sem Personalidade" — BANIDO
- "Eu Quase Desisti de ..." — BANIDO
- "Meu Maior Erro Com ..." — BANIDO
- "Vem Ver o Que Fiz" / "Preciso Te Mostrar" — BANIDO
- "Aquele Cantinho de ... Que Faz ..." — BANIDO
- "[Tema] Minimalista vs. Clássico" — BANIDO
- Títulos genéricos que poderiam servir para QUALQUER tema — BANIDO
- Títulos que só trocam o nome do cômodo mas mantêm a mesma frase — BANIDO
- "Neste artigo", "Aprenda a", "Conheça", "Explore" — BANIDO
- Qualquer coisa que pareça gerada por IA ou clickbait — BANIDO

⚠️ REGRA ANTI-REPETIÇÃO ESTRUTURAL (CRÍTICA):
- As 3 primeiras palavras de cada título devem ser DIFERENTES entre si
- NÃO comece múltiplos títulos com "O dia que...", "Eu aprendi...", "Confesso que..."
- Varie RADICALMENTE: objeto, pergunta, declaração, metáfora, ação
- Cada título DEVE ser uma frase COMPLETA (nunca cortada no meio)

⚠️ NÃO COPIE exemplos! Crie títulos 100% ORIGINAIS.
Cada título deve mencionar um DETALHE CONCRETO e ESPECÍFICO (objeto, cor, material, sensação).

✅ USE linguagem que soa HUMANA e REAL:
- Comece com um OBJETO específico do tema, não com o nome genérico
- Use emoções reais (frustração, alívio, nostalgia, orgulho, surpresa)
- Conte o início de uma micro-história que gera curiosidade
- Faça declarações ousadas que gerem debate`;

    let systemPrompt: string;
    let userMessage: string;

    if (isTitle) {
      systemPrompt = `${kevenPersona}

Gere exatamente 5 títulos COMPLETAMENTE DIFERENTES entre si para o artigo abaixo.
${bannedPhrases}

REGRAS DE VARIEDADE (cada título DEVE usar um estilo diferente — as 3 primeiras palavras NÃO podem se repetir entre títulos):
1. 🎯 OBJETO CONCRETO — comece com um objeto/material específico (ex: "Aquela tinta coral...", "O rolo de espuma...")
2. 🤔 PERGUNTA PROVOCATIVA — questiona algo do senso comum (ex: "Por que ninguém fala sobre...")
3. 💡 DECLARAÇÃO OUSADA — opinião forte e direta (ex: "Parede branca é preguiça de decorar")
4. 🌿 SENSORIAL/POÉTICO — evoca sensações (ex: "Aquele cheiro de tinta fresca num domingo")
5. 🔥 AÇÃO DIRETA — convida à ação (ex: "Pega o pincel e esquece a régua")

Cada título deve ter entre 45 e 80 caracteres e ser uma FRASE COMPLETA (nunca cortada).
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
