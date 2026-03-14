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
    
    // Use anon client to validate the JWT
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error("Not authenticated");
    
    const userId = claimsData.claims.sub as string;

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Not authorized");

    const { type, recipientEmail } = await req.json();

    if (!type || !recipientEmail) {
      throw new Error("type and recipientEmail are required");
    }

    // Get user profile for name
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", userId)
      .maybeSingle();

    const userName = profile?.username || "Admin";
    const logoUrl = `${supabaseUrl}/storage/v1/object/public/site-assets/logo-email.png`;
    const siteUrl = "https://homegardenmanual.com";

    // Fetch a real published article to use as sample data (with cover image)
    const { data: sampleArticle } = await supabase
      .from("content_articles")
      .select("id, title, slug, excerpt, category, cover_image")
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
    const articleUrl = articleSlug ? `${siteUrl}/article/${articleSlug}` : siteUrl;

    let subject = "";
    let htmlContent = "";

    if (type === "newsletter") {
      subject = `🌿 [TESTE] ${articleTitle}`;
      htmlContent = `
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
          <p style="color:rgba(255,255,255,0.8);margin:0;font-size:14px;">Seu guia de casa, jardim, decoração e arquitetura</p>
        </td></tr>
        ${coverImage ? `<!-- Cover Image --><tr><td><img src="${coverImage}" alt="${articleTitle}" style="width:100%;height:auto;display:block;" /></td></tr>` : ""}
        <!-- Content -->
        <tr><td style="padding:40px 30px;">
          <p style="color:#666;font-size:15px;margin:0 0 20px;">Olá, ${userName}! 🌱</p>
          ${articleCategory ? `<span style="display:inline-block;background:#e8f5e9;color:#2d5016;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:bold;margin-bottom:16px;">${articleCategory}</span>` : ""}
          <h2 style="color:#2d5016;font-size:22px;line-height:1.3;margin:8px 0 16px;">${articleTitle}</h2>
          <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 28px;">${articleExcerpt}</p>
          <a href="${articleUrl}" style="display:inline-block;background:linear-gradient(135deg,#2d5016,#4a7c28);color:#ffffff;padding:10px 24px;border-radius:50px;text-decoration:none;font-weight:600;font-size:13px;">Ler mais →</a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#2d5016;padding:25px;text-align:center;">
          <p style="color:rgba(255,255,255,0.7);margin:0;font-size:12px;">
            © ${new Date().getFullYear()} HomeGarden — Seu guia de casa, jardim, decoração e arquitetura
          </p>
          <p style="margin:8px 0 0;">
            <a href="${siteUrl}/unsubscribe" style="color:rgba(255,255,255,0.5);font-size:11px;text-decoration:underline;">Cancelar inscrição</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
    } else if (type === "admin-notification") {
      subject = `🌿 [TESTE] Novo artigo gerado: ${articleTitle}`;
      htmlContent = `
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
        ${coverImage ? `<!-- Cover Image --><tr><td><img src="${coverImage}" alt="${articleTitle}" style="width:100%;height:auto;display:block;" /></td></tr>` : ""}
        <!-- Content -->
        <tr><td style="padding:40px 30px;">
          <p style="color:#666;font-size:15px;margin:0 0 20px;">Olá, ${userName}! 🌱</p>
          <span style="display:inline-block;background:#e8f5e9;color:#2d5016;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:bold;margin-bottom:16px;">Piloto Automático</span>
          ${articleCategory ? `<span style="display:inline-block;background:#e8f5e9;color:#2d5016;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:bold;margin-bottom:16px;margin-left:8px;">${articleCategory}</span>` : ""}
          <h2 style="color:#2d5016;font-size:22px;line-height:1.3;margin:8px 0 16px;">${articleTitle}</h2>
          <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 28px;">${articleExcerpt}</p>
          <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
            <tr>
              <td style="padding-right:12px;">
                <a href="${articleUrl}" style="display:inline-block;background:linear-gradient(135deg,#2d5016,#4a7c28);color:#ffffff;padding:10px 24px;border-radius:50px;text-decoration:none;font-weight:600;font-size:13px;">Ver artigo →</a>
              </td>
              <td>
                <a href="${siteUrl}/admin/articles" style="display:inline-block;background:#e8f5e9;color:#2d5016;padding:10px 24px;border-radius:50px;text-decoration:none;font-weight:600;font-size:13px;">Gerenciar artigos</a>
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
    } else {
      throw new Error(`Unknown test type: ${type}`);
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "HomeGarden <newsletter@homegardenmanual.com>",
        to: [recipientEmail],
        subject,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[send-test-email] Resend error:", errText);
      throw new Error(`Failed to send email: ${errText}`);
    }

    const resData = await res.json();
    console.log(`[send-test-email] Test ${type} email sent to ${recipientEmail}:`, resData.id);

    return new Response(
      JSON.stringify({ success: true, emailId: resData.id, usedArticle: sampleArticle?.title || null }),
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
