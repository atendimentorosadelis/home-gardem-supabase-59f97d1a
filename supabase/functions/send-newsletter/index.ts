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

    const { articleId, articleTitle, articleSlug, articleExcerpt, articleCategory, coverImage } = await req.json();

    if (!articleId || !articleTitle) {
      throw new Error("articleId and articleTitle are required");
    }

    console.log(`[send-newsletter] Sending newsletter for article: ${articleTitle}`);

    // Get active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, name")
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

    const siteUrl = "https://blank-canvas-maker-5273.lovable.app";
    const articleUrl = `${siteUrl}/article/${articleSlug || articleId}`;

    let sent = 0;
    let failed = 0;

    // Send emails in batches
    for (const subscriber of subscribers) {
      try {
        const unsubscribeUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;

        const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;margin-top:20px;margin-bottom:20px;">
    <div style="background:#2d5a27;padding:30px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;">🌿 HomeGarden</h1>
      <p style="color:#c8e6c9;margin:8px 0 0;font-size:14px;">Novidades fresquinhas do jardim!</p>
    </div>
    ${coverImage ? `<div style="width:100%;"><img src="${coverImage}" alt="${articleTitle}" style="width:100%;height:auto;display:block;" /></div>` : ''}
    <div style="padding:30px;">
      ${articleCategory ? `<span style="display:inline-block;background:#e8f5e9;color:#2d5a27;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:bold;margin-bottom:16px;">${articleCategory}</span>` : ''}
      <h2 style="color:#1a1a1a;font-size:22px;line-height:1.3;margin:0 0 16px;">${articleTitle}</h2>
      ${articleExcerpt ? `<p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 24px;">${articleExcerpt}</p>` : ''}
      <a href="${articleUrl}" style="display:inline-block;background:#2d5a27;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">Ler artigo completo →</a>
    </div>
    <div style="padding:20px 30px;background:#f9f9f9;text-align:center;border-top:1px solid #eee;">
      <p style="color:#999;font-size:12px;margin:0;">
        Você recebeu este e-mail porque está inscrito na newsletter do HomeGarden.<br/>
        <a href="${unsubscribeUrl}" style="color:#999;text-decoration:underline;">Cancelar inscrição</a>
      </p>
    </div>
  </div>
</body>
</html>`;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "HomeGarden <noreply@wallistonluiz.com>",
            to: [subscriber.email],
            subject: `🌿 ${articleTitle}`,
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
