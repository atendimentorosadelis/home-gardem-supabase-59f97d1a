import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BRAND_IDENTITY = "HomeGarden — Seu guia de casa, jardim, decoração e arquitetura";

const socialPlatforms = ["facebook", "instagram", "twitter", "youtube", "linkedin", "pinterest", "tiktok"];
const socialIconUrls: Record<string, string> = {
  facebook: "https://homegardenmanual.lovable.app/images/social/facebook.svg",
  instagram: "https://homegardenmanual.lovable.app/images/social/instagram.svg",
  twitter: "https://homegardenmanual.lovable.app/images/social/twitter.svg",
  youtube: "https://homegardenmanual.lovable.app/images/social/youtube.svg",
  linkedin: "https://homegardenmanual.lovable.app/images/social/linkedin.svg",
  pinterest: "https://homegardenmanual.lovable.app/images/social/pinterest.svg",
  tiktok: "https://homegardenmanual.lovable.app/images/social/tiktok.svg",
};
const socialAltNames: Record<string, string> = {
  facebook: "Facebook", instagram: "Instagram", twitter: "X", youtube: "YouTube",
  linkedin: "LinkedIn", pinterest: "Pinterest", tiktok: "TikTok",
};

const translations: Record<string, { defaultName: string; readMore: string; subject: (t: string) => string }> = {
  "pt-BR": { defaultName: "Assinante", readMore: "Ler artigo completo →", subject: (t) => t },
  en: { defaultName: "Subscriber", readMore: "Read full article →", subject: (t) => t },
  es: { defaultName: "Suscriptor(a)", readMore: "Leer artículo completo →", subject: (t) => t },
};

function getTranslation(lang: string) {
  return translations[lang] || translations["pt-BR"];
}

function buildSocialIconsHtml(settings: Record<string, unknown>) {
  const enabled = socialPlatforms.filter((p) => settings[`${p}_enabled`] === true);
  if (enabled.length === 0) return "";
  return `<table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;"><tr>${enabled.map((p) => {
    const url = typeof settings[p] === "string" ? (settings[p] as string).trim() : "";
    if (!url) return "";
    return `<td align="center" valign="middle" style="padding:0 5px;"><a href="${url}" target="_blank" style="display:block;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.15);text-align:center;line-height:36px;text-decoration:none;"><img src="${socialIconUrls[p]}" alt="${socialAltNames[p]}" width="18" height="18" style="display:inline-block;vertical-align:middle;border:0;" /></a></td>`;
  }).filter(Boolean).join("")}</tr></table>`;
}

function resolveRecipientName(email: string, subscriberName?: string | null, profileName?: string | null, fallback?: string) {
  if (subscriberName?.trim()) return subscriberName.trim();
  if (profileName?.trim()) return profileName.trim();
  if (fallback) return fallback;
  const local = email.split("@")[0] || "Assinante";
  return local.replace(/[._-]+/g, " ").trim().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Assinante";
}

function applyReplacements(html: string, replacements: Record<string, string>) {
  let result = html;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

function buildNewsletterContent(params: {
  coverImage: string; articleTitle: string; articleCategory: string;
  articleExcerpt: string; articleUrl: string; readMoreText: string;
}) {
  const { coverImage, articleTitle, articleCategory, articleExcerpt, articleUrl, readMoreText } = params;
  return [
    coverImage ? `<img src="${coverImage}" alt="${articleTitle}" style="width:100%;height:auto;display:block;border-radius:8px;margin:0 0 20px;" />` : "",
    articleCategory ? `<p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">${articleCategory}</p>` : "",
    `<h3 style="margin:0 0 12px;font-size:20px;line-height:1.3;">${articleTitle}</h3>`,
    articleExcerpt ? `<p style="margin:0 0 20px;line-height:1.7;font-size:15px;">${articleExcerpt}</p>` : "",
    `<p style="margin:0;"><a href="${articleUrl}" style="color:inherit;font-weight:600;font-size:14px;text-decoration:underline;">${readMoreText}</a></p>`,
  ].filter(Boolean).join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { articleId, articleTitle, articleSlug, articleExcerpt, articleCategory, coverImage } = await req.json();
    if (!articleId || !articleTitle) throw new Error("articleId and articleTitle are required");

    // Parallel data fetching
    const [
      { data: articleRecord },
      { data: subscribers, error: subError },
      { data: activeTemplate },
      { data: socialLinksData },
    ] = await Promise.all([
      supabase.from("content_articles").select("category_slug").eq("id", articleId).maybeSingle(),
      supabase.from("newsletter_subscribers").select("id, email, name, language").eq("is_active", true),
      supabase.from("email_templates").select("name, html_template").eq("is_default", true).eq("is_active", true).maybeSingle(),
      supabase.from("site_settings").select("value").eq("key", "social_links").maybeSingle(),
    ]);

    if (subError) throw subError;
    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ sent: 0, failed: 0, message: "No active subscribers" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch profile names for subscribers
    const subEmails = [...new Set(subscribers.map((s) => s.email.trim().toLowerCase()))];
    const { data: profiles } = await supabase.from("profiles").select("email, username").in("email", subEmails);
    const profMap = new Map((profiles || []).filter((p) => p.email).map((p) => [p.email!.toLowerCase(), p.username || ""]));

    const socialSettings = (socialLinksData?.value && typeof socialLinksData.value === "object") ? socialLinksData.value as Record<string, unknown> : {};
    const socialIconsHtml = buildSocialIconsHtml(socialSettings);

    const articleCategorySlug = articleRecord?.category_slug || "casa";
    const siteUrl = "https://homegardenmanual.com";
    const logoUrl = `${supabaseUrl}/storage/v1/object/public/site-assets/logo-email.png`;
    const trackOpenUrl = `${supabaseUrl}/functions/v1/track-newsletter-open`;
    const trackClickUrl = `${supabaseUrl}/functions/v1/track-newsletter-click`;
    const templateName = activeTemplate?.name || "Padrão";

    console.log(`[send-newsletter] Sending to ${subscribers.length} subscribers using template: ${templateName}`);

    const { data: historyRecord } = await supabase
      .from("newsletter_send_history")
      .insert({ article_id: articleId, article_title: articleTitle, article_slug: articleSlug || null, total_recipients: subscribers.length, status: "sending" })
      .select("id").single();

    const historyId = historyRecord?.id || "";
    let sent = 0;
    let failed = 0;

    for (const subscriber of subscribers) {
      try {
        const lang = subscriber.language || "pt-BR";
        const t = getTranslation(lang);
        const normalizedEmail = subscriber.email.trim().toLowerCase();
        const subscriberName = resolveRecipientName(normalizedEmail, subscriber.name, profMap.get(normalizedEmail), t.defaultName);

        const articleUrl = `${siteUrl}/${articleCategorySlug}/${articleSlug || articleId}`;
        const trackedArticleUrl = historyId ? `${trackClickUrl}?id=${historyId}&url=${encodeURIComponent(articleUrl)}` : articleUrl;
        const unsubscribeUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
        const openPixelUrl = historyId ? `${trackOpenUrl}?id=${historyId}` : "";

        const contentBlock = buildNewsletterContent({
          coverImage: coverImage || "", articleTitle, articleCategory: articleCategory || "",
          articleExcerpt: articleExcerpt || "", articleUrl: trackedArticleUrl, readMoreText: t.readMore,
        });

        let htmlContent = activeTemplate?.html_template
          ? applyReplacements(activeTemplate.html_template, {
              logo_url: logoUrl,
              site_name: BRAND_IDENTITY,
              name: subscriberName,
              user_name: subscriberName,
              content: contentBlock,
              original_message: articleExcerpt || "",
              year: new Date().getFullYear().toString(),
              email: subscriber.email,
              unsubscribe_url: unsubscribeUrl,
              social_icons: socialIconsHtml,
            })
          : `<html><body><p>Olá, ${subscriberName}!</p>${contentBlock}</body></html>`;

        // Tracking pixel
        if (openPixelUrl) {
          htmlContent = htmlContent.replace("</body>", `<img src="${openPixelUrl}" width="1" height="1" alt="" style="display:none;" /></body>`);
        }

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
          body: JSON.stringify({
            from: "HomeGarden <newsletter@homegardenmanual.com>",
            to: [subscriber.email],
            subject: t.subject(articleTitle),
            html: htmlContent,
          }),
        });

        if (res.ok) { sent++; } else { console.error(`[send-newsletter] Failed for ${subscriber.email}:`, await res.text()); failed++; }
      } catch (e) { console.error(`[send-newsletter] Error for ${subscriber.email}:`, e); failed++; }
    }

    if (historyRecord?.id) {
      await supabase.from("newsletter_send_history").update({
        successful_sends: sent, failed_sends: failed,
        status: failed === subscribers.length ? "failed" : "completed",
      }).eq("id", historyRecord.id);
    }

    console.log(`[send-newsletter] Done: ${sent} sent, ${failed} failed, template: ${templateName}`);
    return new Response(
      JSON.stringify({ sent, failed, total: subscribers.length, templateUsed: templateName }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[send-newsletter] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
