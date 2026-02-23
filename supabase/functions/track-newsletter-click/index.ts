import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const historyId = url.searchParams.get("id");
    const redirect = url.searchParams.get("url");

    if (historyId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Increment click count
      const { data: current } = await supabase
        .from("newsletter_send_history")
        .select("clicked_count")
        .eq("id", historyId)
        .single();

      await supabase
        .from("newsletter_send_history")
        .update({ clicked_count: (current?.clicked_count || 0) + 1 })
        .eq("id", historyId);

      console.log(`[track-click] Recorded click for history: ${historyId}`);
    }
  } catch (e) {
    console.error("[track-click] Error:", e);
  }

  const redirectUrl = new URL(req.url).searchParams.get("url") || "https://blank-canvas-maker-5273.lovable.app";
  
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl,
      "Cache-Control": "no-store",
    },
  });
});
