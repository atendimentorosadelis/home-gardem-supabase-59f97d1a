import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BRAND_NAME = "HomeGarden";
const BRAND_TAGLINE = "Seu guia de casa, jardim, decoração e arquitetura";
const BRAND_IDENTITY = `${BRAND_NAME} — ${BRAND_TAGLINE}`;

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
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "X",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  tiktok: "TikTok",
};

const translations: Record<string, {
  defaultName: string;
  readMore: string;
  subject: (title: string) => string;
}> = {
  "pt-BR": {
    defaultName: "Assinante",
    readMore: "Ler mais →",
    subject: (title) => title,
  },
  en: {
    defaultName: "Subscriber",
    readMore: "Read more →",
    subject: (title) => title,
  },
  es: {
    defaultName: "Suscriptor(a)",
    readMore: "Leer más →",
    subject: (title) => title,
  },
};

function getTranslation(lang: string) {
  return translations[lang] || translations["pt-BR"];
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function prettifyNameFromEmail(email: string) {
  const localPart = email.split("@")[0] || "Assinante";
  return localPart
    .replace(/[._-]+/g, " ")
    .trim()
    .split(" ")
    .map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1) : "")
    .join(" ") || "Assinante";
}

function resolveRecipientName(email: string, ...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return prettifyNameFromEmail(email);
}

function applyTemplateReplacements(html: string, replacements: Record<string, string>) {
  let result = html;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

function buildSocialIconsHtml(settings: Record<string, unknown>) {
  const platforms = ["facebook", "instagram", "twitter", "youtube", "linkedin", "pinterest", "tiktok"];

  const enabledPlatforms = platforms.filter((platform) => settings[`${platform}_enabled`] === true);
  if (enabledPlatforms.length === 0) return "";

  return enabledPlatforms
    .map((platform) => {
      const rawUrl = settings[platform];
      const url = typeof rawUrl === "string" ? rawUrl.trim() : "";
      if (!url) return "";

      return `<a href="${url}" style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.15);margin:0 6px;text-decoration:none;"><img src="${socialIconUrls[platform]}" alt="${socialAltNames[platform]}" width="20" height="20" style="display:block;" /></a>`;
    })
    .filter(Boolean)
    .join("");
}

function buildNewsletterContentBlock(params: {
  coverImage: string;
  articleTitle: string;
  articleCategory: string;
  articleExcerpt: string;
  articleUrl: string;
  readMoreText: string;
}) {
  const { coverImage, articleTitle, articleCategory, articleExcerpt, articleUrl, readMoreText } = params;

  return `
    ${coverImage ? `<img src="${coverImage}" alt="${articleTitle}" style="width:100%;height:auto;display:block;border-radius:10px;margin:0 0 18px;" />` : ""}
    ${articleCategory ? `<p style="margin:0 0 10px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;"><strong>${articleCategory}</strong></p>` : ""}
    <h2 style="margin:0 0 14px;font-size:24px;line-height:1.3;">${articleTitle}</h2>
    ${articleExcerpt ? `<p style="margin:0 0 24px;line-height:1.7;">${articleExcerpt}</p>` : ""}
    <a href="${articleUrl}" style="display:inline-block;padding:10px 22px;border-radius:999px;border:1px solid currentColor;color:inherit;text-decoration:none;font-weight:600;font-size:13px;">${readMoreText}</a>
  `;
}

function buildFallbackTemplate(params: {
  logoUrl: string;
  recipientName: string;
  articleTitle: string;
  articleExcerpt: string;
  articleCategory: string;
  articleUrl: string;
  coverImage: string;
  unsubscribeUrl: string;
  socialIconsHtml: string;
  openPixelUrl: string;
  readMoreText: string;
}) {
  const { logoUrl, recipientName, articleTitle, articleExcerpt, articleCategory, articleUrl, coverImage, unsubscribeUrl, socialIconsHtml, openPixelUrl, readMoreText } = params;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f0f4f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <tr><td style="background:linear-gradient(135deg,#2d5016,#4a7c28);padding:30px;text-align:center;">
          <img src="${logoUrl}" alt="${BRAND_NAME}" width="160" style="display:block;margin:0 auto 12px;" />
          <p style="color:rgba(255,255,255,0.8);margin:0;font-size:14px;">${BRAND_TAGLINE}</p>
        </td></tr>
        ${coverImage ? `<tr><td><img src="${coverImage}" alt="${articleTitle}" style="width:100%;height:auto;display:block;" /></td></tr>` : ""}
        <tr><td style="padding:40px 30px;color:#444;">
          <p style="font-size:15px;margin:0 0 20px;">Olá, ${recipientName}!</p>
          ${articleCategory ? `<p style="margin:0 0 10px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;"><strong>${articleCategory}</strong></p>` : ""}
          <h2 style="margin:0 0 14px;font-size:24px;line-height:1.3;color:#2d5016;">${articleTitle}</h2>
          ${articleExcerpt ? `<p style="margin:0 0 24px;line-height:1.7;">${articleExcerpt}</p>` : ""}
          <a href="${articleUrl}" style="display:inline-block;padding:10px 22px;border-radius:999px;border:1px solid #2d5016;color:#2d5016;text-decoration:none;font-weight:600;font-size:13px;">${readMoreText}</a>
        </td></tr>
        <tr><td style="background:#2d5016;padding:25px;text-align:center;">
          <div style="margin-bottom:14px;">${socialIconsHtml}</div>
          <p style="color:rgba(255,255,255,0.7);margin:0;font-size:12px;">© ${new Date().getFullYear()} ${BRAND_IDENTITY}</p>
          <p style="margin:8px 0 0;"><a href="${unsubscribeUrl}" style="color:rgba(255,255,255,0.6);font-size:11px;text-decoration:underline;">Cancelar inscrição</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
  ${openPixelUrl ? `<img src="${openPixelUrl}" width="1" height="1" alt="" style="display:none;" />` : ""}
</body>
</html>`;
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

    if (!articleId || !articleTitle) {
      throw new Error("articleId and articleTitle are required");
    }

    const [
      { data: articleRecord },
      { data: subscribers, error: subError },
      { data: activeTemplate },
      { data: socialLinksData },
    ] = await Promise.all([
      supabase.from("content_articles").select("category_slug").eq("id", articleId).maybeSingle(),
      supabase.from("newsletter_subscribers").select("id, email, name, language").eq("is_active", true),
      supabase.from("email_templates").select("name, html_template").eq("is_default", true).eq("is_active", true).eq("category", "contact_reply").maybeSingle(),
      supabase.from("site_settings").select("value").eq("key", "social_links").maybeSingle(),
    ]);

    if (subError) throw subError;

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, failed: 0, message: "No active subscribers" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const subscriberEmails = [...new Set(subscribers.map((subscriber) => normalizeEmail(subscriber.email)))];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("email, username")
      .in("email", subscriberEmails);

    const profileNameMap = new Map<string, string>();
    for (const profile of profiles || []) {
      if (profile.email) {
        profileNameMap.set(normalizeEmail(profile.email), profile.username || "");
      }
    }

    const socialSettings = (socialLinksData?.value && typeof socialLinksData.value === "object")
      ? (socialLinksData.value as Record<string, unknown>)
      : {};

    const socialIconsHtml = buildSocialIconsHtml(socialSettings);

    const articleCategorySlug = articleRecord?.category_slug || "casa";
    const siteUrl = "https://homegardenmanual.com";
    const logoUrl = `${supabaseUrl}/storage/v1/object/public/site-assets/logo-email.png`;
    const trackOpenUrl = `${supabaseUrl}/functions/v1/track-newsletter-open`;
    const trackClickUrl = `${supabaseUrl}/functions/v1/track-newsletter-click`;

    const templateName = activeTemplate?.name || "Template Padrão";

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

    const historyId = historyRecord?.id || "";

    let sent = 0;
    let failed = 0;

    for (const subscriber of subscribers) {
      try {
        const lang = subscriber.language || "pt-BR";
        const t = getTranslation(lang);

        const normalizedEmail = normalizeEmail(subscriber.email);
        const subscriberName = resolveRecipientName(
          normalizedEmail,
          subscriber.name,
          profileNameMap.get(normalizedEmail),
          t.defaultName,
        );

        const articleUrl = `${siteUrl}/${articleCategorySlug}/${articleSlug || articleId}`;
        const trackedArticleUrl = historyId ? `${trackClickUrl}?id=${historyId}&url=${encodeURIComponent(articleUrl)}` : articleUrl;
        const unsubscribeUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
        const openPixelUrl = historyId ? `${trackOpenUrl}?id=${historyId}` : "";

        const contentBlock = buildNewsletterContentBlock({
          coverImage: coverImage || "",
          articleTitle,
          articleCategory: articleCategory || "",
          articleExcerpt: articleExcerpt || "",
          articleUrl: trackedArticleUrl,
          readMoreText: t.readMore,
        });

        let htmlContent = activeTemplate?.html_template
          ? applyTemplateReplacements(activeTemplate.html_template, {
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
          : buildFallbackTemplate({
              logoUrl,
              recipientName: subscriberName,
              articleTitle,
              articleExcerpt: articleExcerpt || "",
              articleCategory: articleCategory || "",
              articleUrl: trackedArticleUrl,
              coverImage: coverImage || "",
              unsubscribeUrl,
              socialIconsHtml,
              openPixelUrl,
              readMoreText: t.readMore,
            });

        if (openPixelUrl && activeTemplate?.html_template) {
          htmlContent = htmlContent.replace("</body>", `<img src="${openPixelUrl}" width="1" height="1" alt="" style="display:none;" /></body>`);
        }

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
      } catch (sendError) {
        console.error(`[send-newsletter] Error sending to ${subscriber.email}:`, sendError);
        failed++;
      }
    }

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
