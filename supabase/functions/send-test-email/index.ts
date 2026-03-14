import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildNewsletterContentBlock(params: {
  coverImage: string;
  articleTitle: string;
  articleCategory: string;
  articleExcerpt: string;
  articleUrl: string;
  primaryColor: string;
  primaryBg: string;
}) {
  const { coverImage, articleTitle, articleCategory, articleExcerpt, articleUrl, primaryColor, primaryBg } = params;
  return `
    ${coverImage ? `<img src="${coverImage}" alt="${articleTitle}" style="width:100%;height:auto;display:block;border-radius:8px;margin-bottom:20px;" />` : ""}
    ${articleCategory ? `<span style="display:inline-block;background:${primaryBg};color:${primaryColor};padding:4px 14px;border-radius:20px;font-size:12px;font-weight:bold;margin-bottom:16px;">${articleCategory}</span>` : ""}
    <h2 style="color:${primaryColor};font-size:22px;line-height:1.3;margin:8px 0 16px;">${articleTitle}</h2>
    <p style="font-size:15px;line-height:1.7;margin:0 0 28px;">${articleExcerpt}</p>
    <a href="${articleUrl}" style="display:inline-block;background:${primaryColor};color:#ffffff;padding:10px 24px;border-radius:50px;text-decoration:none;font-weight:600;font-size:13px;">Ler mais →</a>
  `;
}

function buildAdminNotificationContentBlock(params: {
  coverImage: string;
  articleTitle: string;
  articleCategory: string;
  articleExcerpt: string;
  articleUrl: string;
  siteUrl: string;
  primaryColor: string;
  primaryBg: string;
}) {
  const { coverImage, articleTitle, articleCategory, articleExcerpt, articleUrl, siteUrl, primaryColor, primaryBg } = params;
  return `
    ${coverImage ? `<img src="${coverImage}" alt="${articleTitle}" style="width:100%;height:auto;display:block;border-radius:8px;margin-bottom:20px;" />` : ""}
    <span style="display:inline-block;background:${primaryBg};color:${primaryColor};padding:4px 14px;border-radius:20px;font-size:12px;font-weight:bold;margin-bottom:16px;">Piloto Automático</span>
    ${articleCategory ? `<span style="display:inline-block;background:${primaryBg};color:${primaryColor};padding:4px 14px;border-radius:20px;font-size:12px;font-weight:bold;margin-bottom:16px;margin-left:8px;">${articleCategory}</span>` : ""}
    <h2 style="color:${primaryColor};font-size:22px;line-height:1.3;margin:8px 0 16px;">${articleTitle}</h2>
    <p style="font-size:15px;line-height:1.7;margin:0 0 28px;">${articleExcerpt}</p>
    <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
      <tr>
        <td style="padding-right:12px;">
          <a href="${articleUrl}" style="display:inline-block;background:${primaryColor};color:#ffffff;padding:10px 24px;border-radius:50px;text-decoration:none;font-weight:600;font-size:13px;">Ver artigo →</a>
        </td>
        <td>
          <a href="${siteUrl}/admin/articles" style="display:inline-block;background:${primaryBg};color:${primaryColor};padding:10px 24px;border-radius:50px;text-decoration:none;font-weight:600;font-size:13px;">Gerenciar artigos</a>
        </td>
      </tr>
    </table>
  `;
}

function removeOriginalMessageBlock(html: string): string {
  // Remove the entire "original message" div block from contact reply templates
  return html.replace(/<div[^>]*>[\s\S]*?Sua mensagem original:[\s\S]*?<\/div>\s*<\/div>/gi, "")
    .replace(/<div[^>]*>[\s\S]*?Your original message:[\s\S]*?<\/div>\s*<\/div>/gi, "")
    .replace(/\{\{original_message\}\}/g, "");
}

function applyTemplateReplacements(html: string, replacements: Record<string, string>): string {
  let result = html;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

// Detect primary color from template for consistent styling
function detectPrimaryColor(templateName: string): { color: string; bg: string } {
  const colorMap: Record<string, { color: string; bg: string }> = {
    "Clássico Verde": { color: "#2d5016", bg: "#e8f5e9" },
    "Elegante Escuro": { color: "#9ca3af", bg: "rgba(255,255,255,0.1)" },
    "Aurora Botânica": { color: "#5eead4", bg: "rgba(94,234,212,0.15)" },
    "Moderno Minimalista": { color: "#333333", bg: "#f0f0f0" },
    "Natureza Vibrante": { color: "#22d3ee", bg: "rgba(34,211,238,0.15)" },
    "Jardim Floral": { color: "#92400e", bg: "#fef3c7" },
  };
  return colorMap[templateName] || { color: "#2d5016", bg: "#e8f5e9" };
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

    // Verify the user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) throw new Error("Not authenticated");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error("[send-test-email] Auth error:", userError?.message);
      throw new Error("Not authenticated");
    }
    const userId = user.id;

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Not authorized");

    const { type, recipientEmail, recipientEmails } = await req.json();

    const emails: string[] = recipientEmails || (recipientEmail ? [recipientEmail] : []);
    if (!type || emails.length === 0) {
      throw new Error("type and at least one recipient email are required");
    }

    // Fetch subscriber names for all recipient emails
    const { data: subscribers } = await supabase
      .from("newsletter_subscribers")
      .select("email, name")
      .in("email", emails);

    const subscriberMap: Record<string, string> = {};
    if (subscribers) {
      for (const sub of subscribers) {
        subscriberMap[sub.email] = sub.name || "Leitor(a)";
      }
    }

    // Fetch the active/default template
    const { data: activeTemplate } = await supabase
      .from("email_templates")
      .select("name, html_template")
      .eq("is_default", true)
      .eq("category", "contact_reply")
      .maybeSingle();

    const logoUrl = `${supabaseUrl}/storage/v1/object/public/site-assets/logo-email.png`;
    const siteUrl = "https://homegardenmanual.com";

    // Fetch a real published article
    const { data: sampleArticle } = await supabase
      .from("content_articles")
      .select("id, title, slug, excerpt, category, category_slug, cover_image")
      .eq("status", "published")
      .not("cover_image", "is", null)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const articleTitle = sampleArticle?.title || "Como Cultivar um Jardim Vertical em Casa: Guia Completo";
    const articleExcerpt = sampleArticle?.excerpt || "Descubra como transformar qualquer espaço em um jardim vertical exuberante com dicas práticas e inspirações de design para sua casa.";
    const articleCategory = sampleArticle?.category || "Jardim";
    const coverImage = sampleArticle?.cover_image || "";
    const articleSlug = sampleArticle?.slug || "";
    const articleCategorySlug = sampleArticle?.category_slug || "jardim";
    const articleUrl = articleSlug ? `${siteUrl}/${articleCategorySlug}/${articleSlug}` : siteUrl;

    const templateName = activeTemplate?.name || "Clássico Verde";
    const { color: primaryColor, bg: primaryBg } = detectPrimaryColor(templateName);

    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const recipientName = subscriberMap[email] || "Leitor(a)";

      let subject = "";
      let htmlContent = "";

      if (activeTemplate?.html_template) {
        // Use the active template from DB
        const contentBlock = type === "newsletter"
          ? buildNewsletterContentBlock({ coverImage, articleTitle, articleCategory, articleExcerpt, articleUrl, primaryColor, primaryBg })
          : buildAdminNotificationContentBlock({ coverImage, articleTitle, articleCategory, articleExcerpt, articleUrl, siteUrl, primaryColor, primaryBg });

        subject = type === "newsletter"
          ? `[TESTE] ${articleTitle}`
          : `[TESTE] Novo artigo gerado: ${articleTitle}`;

        let templateHtml = activeTemplate.html_template;
        // Remove the "original message" block (it's for contact replies, not newsletters)
        templateHtml = removeOriginalMessageBlock(templateHtml);

        htmlContent = applyTemplateReplacements(templateHtml, {
          logo_url: logoUrl,
          site_name: "HomeGarden",
          name: recipientName,
          user_name: recipientName,
          content: contentBlock,
          year: new Date().getFullYear().toString(),
          email: email,
          unsubscribe_url: `${siteUrl}/unsubscribe?email=${encodeURIComponent(email)}`,
          social_icons: "",
        });
      } else {
        // Fallback: hardcoded classic green template
        subject = type === "newsletter"
          ? `[TESTE] ${articleTitle}`
          : `[TESTE] Novo artigo gerado: ${articleTitle}`;

        htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f0f4f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <tr><td style="background:linear-gradient(135deg,#2d5016,#4a7c28);padding:30px;text-align:center;">
          <img src="${logoUrl}" alt="HomeGarden" width="160" style="display:block;margin:0 auto 12px;" />
          <p style="color:rgba(255,255,255,0.8);margin:0;font-size:14px;">Seu guia de casa, jardim, decoração e arquitetura</p>
        </td></tr>
        ${coverImage ? `<tr><td><img src="${coverImage}" alt="${articleTitle}" style="width:100%;height:auto;display:block;" /></td></tr>` : ""}
        <tr><td style="padding:40px 30px;">
          <p style="color:#666;font-size:15px;margin:0 0 20px;">Olá, ${recipientName}!</p>
          ${articleCategory ? `<span style="display:inline-block;background:#e8f5e9;color:#2d5016;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:bold;margin-bottom:16px;">${articleCategory}</span>` : ""}
          <h2 style="color:#2d5016;font-size:22px;line-height:1.3;margin:8px 0 16px;">${articleTitle}</h2>
          <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 28px;">${articleExcerpt}</p>
          <a href="${articleUrl}" style="display:inline-block;background:linear-gradient(135deg,#2d5016,#4a7c28);color:#ffffff;padding:10px 24px;border-radius:50px;text-decoration:none;font-weight:600;font-size:13px;">Ler mais →</a>
        </td></tr>
        <tr><td style="background:#2d5016;padding:25px;text-align:center;">
          <p style="color:rgba(255,255,255,0.7);margin:0;font-size:12px;">© ${new Date().getFullYear()} HomeGarden — Seu guia de casa, jardim, decoração e arquitetura</p>
          <p style="margin:8px 0 0;"><a href="${siteUrl}/unsubscribe?email=${encodeURIComponent(email)}" style="color:rgba(255,255,255,0.5);font-size:11px;text-decoration:underline;">Cancelar inscrição</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
      }

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "HomeGarden <newsletter@homegardenmanual.com>",
            to: [email],
            subject,
            html: htmlContent,
          }),
        });

        if (res.ok) {
          sent++;
          console.log(`[send-test-email] Test ${type} email sent to ${email} using template: ${templateName}`);
        } else {
          const errText = await res.text();
          console.error(`[send-test-email] Failed for ${email}:`, errText);
          failed++;
        }
      } catch (e) {
        console.error(`[send-test-email] Error sending to ${email}:`, e);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, failed, usedArticle: sampleArticle?.title || null, templateUsed: templateName }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[send-test-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
