import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TranslationRequest {
  title: string;
  excerpt: string;
  content: string;
  targetLanguage: string;
}

interface TranslationResponse {
  title: string;
  excerpt: string;
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, excerpt, content, targetLanguage }: TranslationRequest = await req.json();

    if (!title || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, targetLanguage' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (targetLanguage === 'pt-BR' || targetLanguage === 'pt') {
      return new Response(
        JSON.stringify({ title, excerpt, content }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const languageNames: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
    };

    const targetLangName = languageNames[targetLanguage] || targetLanguage;

    const systemPrompt = `You are a professional translator specializing in home and garden content.
Your task is to translate the following Portuguese (Brazilian) text to ${targetLangName}.

IMPORTANT RULES:
1. Preserve ALL Markdown formatting (headers, bold, italics, lists, etc.)
2. Preserve ALL links in their original format [text](url)
3. Keep the same paragraph structure and line breaks
4. Maintain the tone and style of the original text
5. Do not translate proper nouns, brand names, or technical terms that are commonly used in their original form
6. Translate naturally, not literally - the text should read well in ${targetLangName}
7. Return ONLY a valid JSON object with title, excerpt, and content fields translated

You will receive a JSON object with title, excerpt, and content fields.
Return a JSON object with the same structure but with translated values.`;

    const userMessage = JSON.stringify({
      title,
      excerpt: excerpt || '',
      content: content || ''
    });

    console.log(`Translating content to ${targetLangName} using OpenAI...`);

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
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Invalid API key.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content;

    if (!translatedText) {
      throw new Error('No translation received from AI');
    }

    console.log('Translation received, parsing response...');

    let translatedContent: TranslationResponse;
    try {
      translatedContent = JSON.parse(translatedText);
    } catch (parseError) {
      console.error('Failed to parse translation as JSON:', parseError);
      translatedContent = {
        title: title,
        excerpt: excerpt || '',
        content: translatedText
      };
    }

    console.log('Translation completed successfully');

    return new Response(
      JSON.stringify(translatedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Translation failed',
        fallback: true
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
