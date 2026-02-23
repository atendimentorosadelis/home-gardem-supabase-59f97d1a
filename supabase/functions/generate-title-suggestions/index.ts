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

    let systemPrompt: string;
    let userMessage: string;

    if (isTitle) {
      systemPrompt = `Você é um especialista em SEO e copywriting para blogs de decoração, casa, jardim e arquitetura.
Gere exatamente 5 opções de títulos alternativos para o artigo abaixo.
Os títulos devem ser:
- Criativos, envolventes e otimizados para SEO
- Entre 50 e 70 caracteres
- Usar linguagem sensorial e emocional
- Variados em estilo (pergunta, lista, como fazer, imperativo, inspiracional)
- Relevantes para a categoria "${category || 'decoração'}"

Retorne APENAS um JSON válido no formato: { "suggestions": ["título 1", "título 2", "título 3", "título 4", "título 5"] }`;
      userMessage = `Título atual: ${title}\n${excerpt ? `Resumo: ${excerpt}` : ''}\n${body ? `Primeiros parágrafos: ${body.substring(0, 500)}` : ''}`;
    } else if (isBoth) {
      systemPrompt = `Você é um especialista em SEO e copywriting para blogs de decoração, casa, jardim e arquitetura.
Gere exatamente 5 opções alternativas, cada uma com um título E um resumo (excerpt) correspondente.
Regras para TÍTULOS:
- Criativos, envolventes e otimizados para SEO
- Entre 50 e 70 caracteres
- Usar linguagem sensorial e emocional
- Variados em estilo
Regras para RESUMOS:
- Complementar o título
- Entre 120 e 160 caracteres
- Despertar curiosidade e interesse
- Otimizado para meta description SEO

Retorne APENAS um JSON válido no formato:
{ "suggestions": [{ "title": "título 1", "excerpt": "resumo 1" }, { "title": "título 2", "excerpt": "resumo 2" }, ...] }`;
      userMessage = `Título atual: ${title}\nResumo atual: ${excerpt || 'Sem resumo'}\n${body ? `Primeiros parágrafos: ${body.substring(0, 500)}` : ''}`;
    } else {
      // excerpt only
      systemPrompt = `Você é um especialista em SEO e copywriting para blogs de decoração, casa, jardim e arquitetura.
Gere exatamente 5 opções de resumos (excerpts) alternativos para o artigo abaixo.
Os resumos devem ser:
- Complementar o título existente
- Entre 120 e 160 caracteres
- Despertar curiosidade e interesse
- Otimizados para meta description SEO
- Variados em tom (informativo, emocional, prático, inspiracional, direto)

Retorne APENAS um JSON válido no formato: { "suggestions": ["resumo 1", "resumo 2", "resumo 3", "resumo 4", "resumo 5"] }`;
      userMessage = `Título: ${title}\nResumo atual: ${excerpt || 'Sem resumo'}\n${body ? `Primeiros parágrafos: ${body.substring(0, 500)}` : ''}`;
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
        temperature: 0.8,
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
