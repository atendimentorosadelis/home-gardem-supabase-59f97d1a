import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Map topic IDs to descriptive prompts for article generation
const TOPIC_PROMPTS: Record<string, string> = {
  'sala': 'Dicas de design interno para sala de estar',
  'sala-jantar': 'Dicas de design interno para sala de jantar',
  'lareira': 'Dicas de design interno para lareira',
  'area-gourmet': 'Dicas de design interno para área gourmet',
  'quarto': 'Dicas de design interno para quarto',
  'banheiro': 'Dicas de design interno para banheiro',
  'escritorio': 'Dicas de design interno para escritório',
  'cozinha': 'Dicas de design interno para cozinha',
  'varanda': 'Dicas de design interno para varanda',
  'area-servico': 'Dicas de design interno para área de serviço',
  'piscina': 'Dicas de design interno para área de piscina',
  'jardim': 'Jardim: dicas e inspirações para jardim',
  'decoracao': 'Jardim: dicas de decoração para jardim',
  'cuidados': 'Jardim: cuidados com a plantação',
  'jardim-vertical': 'Jardim: jardim vertical',
  'jardim-suculentas': 'Jardim: suculentas e cactos',
  'jardim-ervas': 'Jardim: horta de ervas',
  'jardim-flores': 'Jardim: flores ornamentais',
  'jardim-paisagismo': 'Jardim: paisagismo',
  'jardim-hidroponia': 'Jardim: hidroponia',
  'jardim-sustentavel': 'Jardim: jardim sustentável',
  'jardim-halloween': 'Jardim: decoração de halloween',
  'colonial': 'Dicas de arquitetura em estilo colonial',
  'industrial': 'Dicas de arquitetura em estilo industrial',
  'moderno': 'Dicas de arquitetura em estilo moderno',
  'neolitico': 'Dicas de arquitetura em estilo neolítico',
  'europeu': 'Dicas de arquitetura em estilo europeu',
  'nordico': 'Dicas de arquitetura em estilo nórdico',
  'neo-classico': 'Dicas de arquitetura em estilo neo clássico',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || '';
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const startTime = Date.now();
  let logId: string | null = null;

  try {
    const body = await req.json().catch(() => ({}));
    const force = body.force === true;

    // 1. Read auto generation config
    const { data: config, error: configError } = await supabase
      .from('auto_generation_config')
      .select('*')
      .maybeSingle();

    if (configError) throw new Error(`Config error: ${configError.message}`);
    if (!config) throw new Error('Auto generation config not found');

    // 2. Check if enabled (unless force)
    if (!config.enabled && !force) {
      return new Response(
        JSON.stringify({ success: false, message: 'Piloto automático está desativado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Check daily limit (unless force)
    if (!force) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('auto_generation_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'success')
        .gte('executed_at', today.toISOString());

      if ((count || 0) >= (config.daily_limit || 3)) {
        return new Response(
          JSON.stringify({ success: false, message: 'Limite diário atingido' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 4. Pick a random topic
    const allTopicIds = Object.keys(TOPIC_PROMPTS);
    let randomTopicId: string;
    let randomTopic: string;

    if (config.random_all_topics) {
      // Random from ALL available topics
      randomTopicId = allTopicIds[Math.floor(Math.random() * allTopicIds.length)];
      randomTopic = TOPIC_PROMPTS[randomTopicId];
      console.log(`[AutoGenerate] Random ALL mode - picked from ${allTopicIds.length} topics`);
    } else {
      // Random from selected topics only
      const topics: string[] = Array.isArray(config.topics) ? config.topics : [];
      if (topics.length === 0) {
        throw new Error('Nenhum tema configurado no piloto automático');
      }
      randomTopicId = topics[Math.floor(Math.random() * topics.length)];
      randomTopic = TOPIC_PROMPTS[randomTopicId] || randomTopicId;
    }

    // 5. Create a log entry
    const { data: logEntry } = await supabase
      .from('auto_generation_logs')
      .insert({ topic_used: randomTopic, status: 'running' })
      .select('id')
      .single();
    logId = logEntry?.id || null;

    console.log(`[AutoGenerate] Starting generation for topic: ${randomTopic}`);

    // 6. Call generate-full-article edge function internally
    const generateUrl = `${SUPABASE_URL}/functions/v1/generate-full-article`;
    const generateResponse = await fetch(generateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ topic: randomTopic }),
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      throw new Error(`generate-full-article failed: ${generateResponse.status} - ${errorText}`);
    }

    const articleData = await generateResponse.json();

    if (!articleData?.success || !articleData?.article) {
      throw new Error(articleData?.error || 'Article generation returned no data');
    }

    const article = articleData.article;
    console.log(`[AutoGenerate] Article generated: ${article.title}`);

    // 7. Save article to database
    const articleRecord = {
      title: article.title,
      body: article.content,
      excerpt: article.excerpt,
      category: article.category,
      category_slug: article.categorySlug,
      slug: article.slug,
      tags: article.tags || [],
      keywords: article.keywords || '',
      read_time: article.readTime || '5 min',
      main_subject: article.mainSubject || '',
      visual_context: article.visualContext || '',
      gallery_prompts: article.galleryPrompts || [],
      status: config.publish_immediately ? 'published' : 'draft',
      published_at: config.publish_immediately ? new Date().toISOString() : null,
    };

    const { data: savedArticle, error: saveError } = await supabase
      .from('content_articles')
      .insert(articleRecord)
      .select('id')
      .single();

    if (saveError) throw new Error(`Save error: ${saveError.message}`);
    const articleId = savedArticle.id;

    console.log(`[AutoGenerate] Article saved with ID: ${articleId}`);

    // 8. Generate cover image
    try {
      const imageUrl = `${SUPABASE_URL}/functions/v1/generate-article-image`;
      const imageResponse = await fetch(imageUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          title: article.title,
          type: 'cover',
          slug: article.slug,
          articleId,
          mainSubject: article.mainSubject || '',
          visualContext: article.visualContext || '',
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        if (imageData?.success && imageData?.imageUrl) {
          await supabase
            .from('content_articles')
            .update({ cover_image: imageData.imageUrl })
            .eq('id', articleId);
          console.log(`[AutoGenerate] Cover image generated`);
        }
      }
    } catch (imgErr) {
      console.error('[AutoGenerate] Cover image error (non-fatal):', imgErr);
    }

    // 9. Generate gallery images (up to 6)
    const galleryPrompts: string[] = article.galleryPrompts || [];
    const galleryImages: string[] = [];

    for (let i = 0; i < Math.min(galleryPrompts.length, 6); i++) {
      try {
        const imageUrl = `${SUPABASE_URL}/functions/v1/generate-article-image`;
        const imageResponse = await fetch(imageUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            title: article.title,
            type: 'gallery',
            customPrompt: galleryPrompts[i],
            slug: article.slug,
            articleId,
            imageIndex: i,
            mainSubject: article.mainSubject || '',
            visualContext: article.visualContext || '',
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          if (imageData?.success && imageData?.imageUrl) {
            galleryImages.push(imageData.imageUrl);
          }
        }
      } catch (galleryErr) {
        console.error(`[AutoGenerate] Gallery image ${i} error:`, galleryErr);
      }
    }

    if (galleryImages.length > 0) {
      await supabase
        .from('content_articles')
        .update({ gallery_images: galleryImages })
        .eq('id', articleId);
      console.log(`[AutoGenerate] ${galleryImages.length} gallery images generated`);
    }

    // 10. Generate emotional conclusion
    try {
      const conclusionUrl = `${SUPABASE_URL}/functions/v1/generate-emotional-conclusion`;
      const conclusionResponse = await fetch(conclusionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          theme: article.title,
          article_id: articleId,
        }),
      });

      if (conclusionResponse.ok) {
        const conclusionData = await conclusionResponse.json();
        if (conclusionData?.emotional_text) {
          // Inject conclusion into body
          const conclusionCard = `\n\n## ✨ Reflexão Final\n\n> ${conclusionData.emotional_text}\n\n`;
          const currentBody = article.content || '';
          const faqMatch = currentBody.match(/##\s*(FAQ|Perguntas\s+Frequentes)/i);

          let updatedBody: string;
          if (faqMatch && faqMatch.index !== undefined) {
            updatedBody = currentBody.substring(0, faqMatch.index) + conclusionCard + currentBody.substring(faqMatch.index);
          } else {
            updatedBody = currentBody + conclusionCard;
          }

          await supabase
            .from('content_articles')
            .update({ body: updatedBody })
            .eq('id', articleId);
          console.log(`[AutoGenerate] Emotional conclusion added`);
        }
      }
    } catch (concErr) {
      console.error('[AutoGenerate] Emotional conclusion error (non-fatal):', concErr);
    }

    // 11. Update log as success
    const durationMs = Date.now() - startTime;
    if (logId) {
      await supabase
        .from('auto_generation_logs')
        .update({ status: 'success', article_id: articleId, duration_ms: durationMs })
        .eq('id', logId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        title: article.title,
        articleId,
        topic: randomTopic,
        durationMs,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AutoGenerate] Error:', error);

    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update log as error
    if (logId) {
      await supabase
        .from('auto_generation_logs')
        .update({ status: 'error', error_message: errorMessage, duration_ms: durationMs })
        .eq('id', logId);
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
