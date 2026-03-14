import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleId, articleTitle, articleSlug, creationSource } = await req.json();

    if (!articleId || !articleTitle) {
      return new Response(
        JSON.stringify({ error: "articleId and articleTitle are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all admin user IDs
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (!admins || admins.length === 0) {
      console.log("[notify-article-ready] No admins found");
      return new Response(
        JSON.stringify({ success: true, notified: 0, emailed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Create in-app notifications
    const notifications = admins.map((admin) => ({
      user_id: admin.user_id,
      title: "Novo artigo pronto!",
      message: `O artigo "${articleTitle}" foi gerado e está pronto para revisão.`,
      type: "article_ready",
      link: `/admin/articles`,
    }));

    await supabase.from("notifications").insert(notifications);
    console.log(`[notify-article-ready] ${admins.length} in-app notifications created`);

    // 2. Send email notifications using the same template as the newsletter
    let emailed = 0;
    if (resendApiKey) {
      const adminUserIds = admins.map((a) => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, username")
        .in("user_id", adminUserIds);

      const adminEmails = (profiles || []).filter((p) => p.email);

      if (adminEmails.length > 0) {
        const sourceLabel = creationSource === "autopilot" ? "Piloto Automático" : "Geração Manual";
        const siteUrl = "https://homegardenmanual.com";
        const logoUrl = `${supabaseUrl}/storage/v1/object/public/site-assets/logo-email.png`;
        // Get article details including cover image and category_slug
        const { data: articleData } = await supabase
          .from("content_articles")
          .select("cover_image, excerpt, category, category_slug")
          .eq("id", articleId)
          .maybeSingle();

        const articleCategorySlug = articleData?.category_slug || "jardim";
        const articleUrl = `${siteUrl}/${articleCategorySlug}/${articleSlug || articleId}`;
        const editorUrl = `${siteUrl}/admin/articles`;

        const coverImage = articleData?.cover_image || "";
        const excerpt = articleData?.excerpt || "";
        const category = articleData?.category || "";

        for (const admin of adminEmails) {
          try {
            const adminName = admin.username || "Admin";

            const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f0f4f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header with logo -->
        <tr><td style="background:linear-gradient(135deg,#2d5016,#4a7c28);padding:30px;text-align:center;">
          <img src="${logoUrl}" alt="HomeGarden" width="160" style="display:block;margin:0 auto 12px;" />
          <p style="color:rgba(255,255,255,0.8);margin:0;font-size:14px;">Notificação para Administradores</p>
        </td></tr>
        ${coverImage ? `<tr><td><img src="${coverImage}" alt="${articleTitle}" style="width:100%;height:auto;display:block;" /></td></tr>` : ""}
        <!-- Content -->
        <tr><td style="padding:40px 30px;">
          <p style="color:#666;font-size:15px;margin:0 0 20px;">Olá, ${adminName}! 🌱</p>
          <span style="display:inline-block;background:#e8f5e9;color:#2d5016;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:bold;margin-bottom:16px;">${sourceLabel}</span>
          ${category ? `<span style="display:inline-block;background:#e8f5e9;color:#2d5016;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:bold;margin-bottom:16px;margin-left:8px;">${category}</span>` : ""}
          <h2 style="color:#2d5016;font-size:22px;line-height:1.3;margin:8px 0 16px;">${articleTitle}</h2>
          ${excerpt ? `<p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 28px;">${excerpt}</p>` : ""}
          <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
            <tr>
              <td style="padding-right:12px;">
                <a href="${articleUrl}" style="display:inline-block;background:linear-gradient(135deg,#2d5016,#4a7c28);color:#ffffff;padding:10px 24px;border-radius:50px;text-decoration:none;font-weight:600;font-size:13px;">Ver artigo →</a>
              </td>
              <td>
                <a href="${editorUrl}" style="display:inline-block;background:#e8f5e9;color:#2d5016;padding:10px 24px;border-radius:50px;text-decoration:none;font-weight:600;font-size:13px;">Gerenciar artigos</a>
              </td>
            </tr>
          </table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#2d5016;padding:25px;text-align:center;">
          <p style="color:rgba(255,255,255,0.7);margin:0;font-size:12px;">
            © ${new Date().getFullYear()} HomeGarden — Seu guia de casa, jardim, decoração e arquitetura
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
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
                to: [admin.email],
                subject: `🌿 Novo artigo gerado: ${articleTitle}`,
                html: htmlContent,
              }),
            });

            if (res.ok) {
              emailed++;
              console.log(`[notify-article-ready] Email sent to ${admin.email}`);
            } else {
              const errText = await res.text();
              console.error(`[notify-article-ready] Email failed for ${admin.email}:`, errText);
            }
          } catch (emailErr) {
            console.error(`[notify-article-ready] Email error for ${admin.email}:`, emailErr);
          }
        }
      }
    } else {
      console.warn("[notify-article-ready] RESEND_API_KEY not configured, skipping emails");
    }

    console.log(`[notify-article-ready] Done: ${admins.length} notified, ${emailed} emailed`);

    return new Response(
      JSON.stringify({ success: true, notified: admins.length, emailed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-article-ready:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
