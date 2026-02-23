import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const translations: Record<string, {
  greeting: string;
  defaultName: string;
  tagline: string;
  readMore: string;
  footer: string;
  unsubscribe: string;
  subject: (title: string) => string;
}> = {
  "pt-BR": {
    greeting: "Olá",
    defaultName: "Amante da jardinagem",
    tagline: "Seu guia de casa, jardim, decoração e arquitetura",
    readMore: "Ler mais →",
    footer: "Seu guia de casa, jardim, decoração e arquitetura",
    unsubscribe: "Cancelar inscrição",
    subject: (title) => `🌿 ${title}`,
  },
  en: {
    greeting: "Hello",
    defaultName: "Garden lover",
    tagline: "Your guide to home, garden, decor and architecture",
    readMore: "Read more →",
    footer: "Your guide to home, garden, decor and architecture",
    unsubscribe: "Unsubscribe",
    subject: (title) => `🌿 ${title}`,
  },
  es: {
    greeting: "Hola",
    defaultName: "Amante de la jardinería",
    tagline: "Tu guía de hogar, jardín, decoración y arquitectura",
    readMore: "Leer más →",
    footer: "Tu guía de hogar, jardín, decoración y arquitectura",
    unsubscribe: "Cancelar suscripción",
    subject: (title) => `🌿 ${title}`,
  },
};

function getTranslation(lang: string) {
  return translations[lang] || translations["pt-BR"];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { articleId, articleTitle, articleSlug, articleExcerpt, articleCategory, coverImage } = await req.json();

    if (!articleId || !articleTitle) {
      throw new Error("articleId and articleTitle are required");
    }

    console.log(`[send-newsletter] Sending newsletter for article: ${articleTitle}`);

    // Get active subscribers with language
    const { data: subscribers, error: subError } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, name, language")
      .eq("is_active", true);

    if (subError) throw subError;

    if (!subscribers || subscribers.length === 0) {
      console.log("[send-newsletter] No active subscribers found");
      return new Response(
        JSON.stringify({ sent: 0, failed: 0, message: "No active subscribers" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-newsletter] Found ${subscribers.length} active subscribers`);

    // Create send history record
    const { data: historyRecord, error: historyError } = await supabase
      .from("newsletter_send_history")
      .insert({
        article_id: articleId,
        article_title: articleTitle,
        article_slug: articleSlug || null,
        total_recipients: subscribers.length,
        status: "sending",
      })
      .select("id")
      .single();

    if (historyError) {
      console.error("[send-newsletter] Error creating history:", historyError);
    }

    const siteUrl = "https://homegardenmanual.com";
    const logoUrl = `${supabaseUrl}/storage/v1/object/public/site-assets/logo-email.png`;
    const trackOpenUrl = `${supabaseUrl}/functions/v1/track-newsletter-open`;
    const trackClickUrl = `${supabaseUrl}/functions/v1/track-newsletter-click`;
    const historyId = historyRecord?.id || "";

    let sent = 0;
    let failed = 0;

    for (const subscriber of subscribers) {
      try {
        const lang = subscriber.language || "pt-BR";
        const t = getTranslation(lang);
        const articleUrl = `${siteUrl}/article/${articleSlug || articleId}`;
        const trackedArticleUrl = historyId ? `${trackClickUrl}?id=${historyId}&url=${encodeURIComponent(articleUrl)}` : articleUrl;
        const unsubscribeUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
        const openPixelUrl = historyId ? `${trackOpenUrl}?id=${historyId}` : "";
        const subscriberName = subscriber.name || t.defaultName;

        const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f0f4f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#2d5016,#4a7c28);padding:30px;text-align:center;">
          <img src="${logoUrl}" alt="HomeGarden" width="160" style="display:block;margin:0 auto 12px;" />
          <p style="color:rgba(255,255,255,0.8);margin:0;font-size:14px;">${t.tagline}</p>
        </td></tr>
        ${coverImage ? `<tr><td><img src="${coverImage}" alt="${articleTitle}" style="width:100%;height:auto;display:block;" /></td></tr>` : ''}
        <!-- Content -->
        <tr><td style="padding:40px 30px;">
          <p style="color:#666;font-size:15px;margin:0 0 20px;">${t.greeting}, ${subscriberName}! 🌱</p>
          ${articleCategory ? `<span style="display:inline-block;background:#e8f5e9;color:#2d5016;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:bold;margin-bottom:16px;">${articleCategory}</span>` : ''}
          <h2 style="color:#2d5016;font-size:22px;line-height:1.3;margin:8px 0 16px;">${articleTitle}</h2>
          ${articleExcerpt ? `<p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 28px;">${articleExcerpt}</p>` : ''}
          <a href="${trackedArticleUrl}" style="display:inline-block;background:linear-gradient(135deg,#2d5016,#4a7c28);color:#ffffff;padding:10px 24px;border-radius:50px;text-decoration:none;font-weight:600;font-size:13px;">${t.readMore}</a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#2d5016;padding:25px;text-align:center;">
          <p style="color:rgba(255,255,255,0.7);margin:0;font-size:12px;">
            © ${new Date().getFullYear()} HomeGarden — ${t.footer}
          </p>
          <p style="margin:8px 0 0;">
            <a href="${unsubscribeUrl}" style="color:rgba(255,255,255,0.5);font-size:11px;text-decoration:underline;">${t.unsubscribe}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
  ${openPixelUrl ? `<img src="${openPixelUrl}" width="1" height="1" alt="" style="display:none;" />` : ''}
</body>
</html>`;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "HomeGarden <newsletter@homegardenmanual.com>",
            to: [subscriber.email],
            subject: t.subject(articleTitle),
            html: htmlContent,
          }),
        });

        if (res.ok) {
          sent++;
        } else {
          const errText = await res.text();
          console.error(`[send-newsletter] Failed for ${subscriber.email}:`, errText);
          failed++;
        }
      } catch (e) {
        console.error(`[send-newsletter] Error sending to ${subscriber.email}:`, e);
        failed++;
      }
    }

    // Update history record
    if (historyRecord?.id) {
      await supabase
        .from("newsletter_send_history")
        .update({
          successful_sends: sent,
          failed_sends: failed,
          status: failed === subscribers.length ? "failed" : "completed",
        })
        .eq("id", historyRecord.id);
    }

    console.log(`[send-newsletter] Done: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ sent, failed, total: subscribers.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[send-newsletter] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
