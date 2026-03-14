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

function buildSocialIconsHtml(settings: Record<string, unknown>) {
  const enabled = socialPlatforms.filter((p) => settings[`${p}_enabled`] === true);
  if (enabled.length === 0) return "";
  return `<table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;"><tr>${enabled.map((p) => {
    const url = typeof settings[p] === "string" ? (settings[p] as string).trim() : "";
    if (!url) return "";
    return `<td align="center" valign="middle" style="padding:0 5px;"><a href="${url}" target="_blank" style="display:block;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.15);text-align:center;line-height:36px;text-decoration:none;"><img src="${socialIconUrls[p]}" alt="${socialAltNames[p]}" width="18" height="18" style="display:inline-block;vertical-align:middle;border:0;" /></a></td>`;
  }).filter(Boolean).join("")}</tr></table>`;
}

function resolveRecipientName(email: string, subscriberName?: string | null, profileName?: string | null) {
  if (subscriberName && subscriberName.trim()) return subscriberName.trim();
  if (profileName && profileName.trim()) return profileName.trim();
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

// Build newsletter article content to go inside {{content}} — uses NO hardcoded colors so it inherits from template
function buildNewsletterContent(params: {
  coverImage: string; articleTitle: string; articleCategory: string;
  articleExcerpt: string; articleUrl: string;
}) {
  const { coverImage, articleTitle, articleCategory, articleExcerpt, articleUrl } = params;
  return [
    coverImage ? `<img src="${coverImage}" alt="${articleTitle}" style="width:100%;height:auto;display:block;border-radius:8px;margin:0 0 20px;" />` : "",
    articleCategory ? `<p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">${articleCategory}</p>` : "",
    `<h3 style="margin:0 0 12px;font-size:20px;line-height:1.3;">${articleTitle}</h3>`,
    articleExcerpt ? `<p style="margin:0 0 20px;line-height:1.7;font-size:15px;">${articleExcerpt}</p>` : "",
    `<p style="margin:0;"><a href="${articleUrl}" style="color:inherit;font-weight:600;font-size:14px;text-decoration:underline;">Ler artigo completo →</a></p>`,
  ].filter(Boolean).join("\n");
}

function buildAdminContent(params: {
  coverImage: string; articleTitle: string; articleCategory: string;
  articleExcerpt: string; articleUrl: string; siteUrl: string;
}) {
  const { coverImage, articleTitle, articleCategory, articleExcerpt, articleUrl, siteUrl } = params;
  return [
    coverImage ? `<img src="${coverImage}" alt="${articleTitle}" style="width:100%;height:auto;display:block;border-radius:8px;margin:0 0 20px;" />` : "",
    `<p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">Piloto Automático${articleCategory ? ` · ${articleCategory}` : ""}</p>`,
    `<h3 style="margin:0 0 12px;font-size:20px;line-height:1.3;">${articleTitle}</h3>`,
    articleExcerpt ? `<p style="margin:0 0 20px;line-height:1.7;font-size:15px;">${articleExcerpt}</p>` : "",
    `<p style="margin:0;"><a href="${articleUrl}" style="color:inherit;font-weight:600;font-size:14px;text-decoration:underline;">Ver artigo →</a> &nbsp;·&nbsp; <a href="${siteUrl}/admin/articles" style="color:inherit;font-size:14px;text-decoration:underline;">Gerenciar artigos</a></p>`,
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

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Not authenticated");
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) throw new Error("Not authenticated");
    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) throw new Error("Not authorized");

    const { type, recipientEmail, recipientEmails } = await req.json();
    const rawEmails: string[] = recipientEmails || (recipientEmail ? [recipientEmail] : []);
    const emails = [...new Set(rawEmails.map((e: string) => e.trim().toLowerCase()).filter(Boolean))];
    if (!type || emails.length === 0) throw new Error("type and at least one recipient email are required");

    // Parallel data fetching
    const [
      { data: subscribers },
      { data: profiles },
      { data: activeTemplate },
      { data: socialLinksData },
      { data: sampleArticle },
    ] = await Promise.all([
      supabase.from("newsletter_subscribers").select("email, name").in("email", emails),
      supabase.from("profiles").select("email, username").in("email", emails),
      supabase.from("email_templates").select("name, html_template").eq("is_default", true).eq("is_active", true).maybeSingle(),
      supabase.from("site_settings").select("value").eq("key", "social_links").maybeSingle(),
      supabase.from("content_articles").select("id, title, slug, excerpt, category, category_slug, cover_image").eq("status", "published").not("cover_image", "is", null).order("published_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const subMap = new Map((subscribers || []).map((s) => [s.email.toLowerCase(), s.name || ""]));
    const profMap = new Map((profiles || []).filter((p) => p.email).map((p) => [p.email!.toLowerCase(), p.username || ""]));
    const socialSettings = (socialLinksData?.value && typeof socialLinksData.value === "object") ? socialLinksData.value as Record<string, unknown> : {};
    const socialIconsHtml = buildSocialIconsHtml(socialSettings);

    const logoUrl = `${supabaseUrl}/storage/v1/object/public/site-assets/logo-email.png`;
    const siteUrl = "https://homegardenmanual.com";
    const articleTitle = sampleArticle?.title || "Dicas práticas para sua casa e jardim";
    const articleExcerpt = sampleArticle?.excerpt || "Confira as melhores dicas de casa, jardim, decoração e arquitetura.";
    const articleCategory = sampleArticle?.category || "Casa";
    const coverImage = sampleArticle?.cover_image || "";
    const articleSlug = sampleArticle?.slug || "";
    const articleCategorySlug = sampleArticle?.category_slug || "casa";
    const articleUrl = articleSlug ? `${siteUrl}/${articleCategorySlug}/${articleSlug}` : siteUrl;

    const templateName = activeTemplate?.name || "Padrão";

    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const recipientName = resolveRecipientName(email, subMap.get(email), profMap.get(email));

      const subject = type === "newsletter"
        ? `[TESTE] ${articleTitle}`
        : `[TESTE] Novo artigo gerado: ${articleTitle}`;

      const contentBlock = type === "newsletter"
        ? buildNewsletterContent({ coverImage, articleTitle, articleCategory, articleExcerpt, articleUrl })
        : buildAdminContent({ coverImage, articleTitle, articleCategory, articleExcerpt, articleUrl, siteUrl });

      const unsubscribeUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(email)}`;

      // Use the template exactly as-is, just fill placeholders
      const htmlContent = activeTemplate?.html_template
        ? applyReplacements(activeTemplate.html_template, {
            logo_url: logoUrl,
            site_name: BRAND_IDENTITY,
            name: recipientName,
            user_name: recipientName,
            content: contentBlock,
            original_message: articleExcerpt,
            year: new Date().getFullYear().toString(),
            email,
            unsubscribe_url: unsubscribeUrl,
            social_icons: socialIconsHtml,
          })
        : `<html><body><p>Olá, ${recipientName}!</p>${contentBlock}</body></html>`;

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
          body: JSON.stringify({
            from: "HomeGarden <newsletter@homegardenmanual.com>",
            to: [email],
            subject,
            html: htmlContent,
          }),
        });
        if (res.ok) { sent++; } else { console.error(`[send-test-email] Failed for ${email}:`, await res.text()); failed++; }
      } catch (e) { console.error(`[send-test-email] Error for ${email}:`, e); failed++; }
    }

    return new Response(
      JSON.stringify({ success: true, sent, failed, usedArticle: sampleArticle?.title || null, templateUsed: templateName }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[send-test-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
