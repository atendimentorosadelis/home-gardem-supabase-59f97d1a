import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_ADS_TXT = "google.com, pub-8413330105117878, DIRECT, f08c47fec0942fa0";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "seo_settings")
      .maybeSingle();

    let adsContent = DEFAULT_ADS_TXT;

    if (data?.value) {
      const settings = data.value as Record<string, unknown>;
      if (settings.ads_txt_content && typeof settings.ads_txt_content === "string" && settings.ads_txt_content.trim()) {
        // Only use DB content if it doesn't contain placeholder
        if (!settings.ads_txt_content.includes("pub-XXXXX")) {
          adsContent = settings.ads_txt_content.trim();
        }
      }
    }

    return new Response(adsContent + "\n", {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error serving ads.txt:", error);
    return new Response(DEFAULT_ADS_TXT + "\n", {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        ...corsHeaders,
      },
    });
  }
});
