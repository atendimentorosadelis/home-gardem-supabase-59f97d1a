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

    // 2. Send email notifications to all admins via Resend
    let emailed = 0;
    if (resendApiKey) {
      // Get admin emails from profiles
      const adminUserIds = admins.map((a) => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, username")
        .in("user_id", adminUserIds);

      const adminEmails = (profiles || []).filter((p) => p.email);

      if (adminEmails.length > 0) {
        const sourceLabel = creationSource === "autopilot" ? "Piloto Automático" : "Geração Manual";
        const articleUrl = `https://homegardenmanual.com/article/${articleSlug || articleId}`;
        const editorUrl = `https://homegardenmanual.com/admin/articles`;

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
        <tr><td style="background:linear-gradient(135deg,#2d5016,#4a7c28);padding:30px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:22px;">🌿 HomeGarden</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Notificação para Administradores</p>
        </td></tr>
        <tr><td style="padding:40px 30px;">
          <p style="color:#333;font-size:16px;margin:0 0 20px;">Olá, <strong>${adminName}</strong>! 👋</p>
          <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 12px;">
            Um novo artigo foi gerado via <strong>${sourceLabel}</strong> e está pronto para revisão:
          </p>
          <div style="background:#f8faf5;border-left:4px solid #4a7c28;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;">
            <h3 style="color:#2d5016;margin:0 0 8px;font-size:18px;">${articleTitle}</h3>
          </div>
          <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
            <tr>
              <td style="padding-right:12px;">
                <a href="${articleUrl}" style="display:inline-block;background:linear-gradient(135deg,#2d5016,#4a7c28);color:#ffffff;padding:12px 24px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;">Ver artigo →</a>
              </td>
              <td>
                <a href="${editorUrl}" style="display:inline-block;background:#e8f5e9;color:#2d5016;padding:12px 24px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;">Gerenciar artigos</a>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="background:#2d5016;padding:20px;text-align:center;">
          <p style="color:rgba(255,255,255,0.6);margin:0;font-size:11px;">
            © ${new Date().getFullYear()} HomeGarden — Notificação interna para administradores
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
