import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: templates, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("category", "contact_reply")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching templates:", error);
      throw error;
    }

    let socialSettings = {};
    const { data: socialData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "social_links")
      .maybeSingle();

    if (socialData?.value) {
      socialSettings = socialData.value;
    }

    return new Response(
      JSON.stringify({
        success: true,
        templates: templates || [],
        socialSettings,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in get-email-templates:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        templates: [],
        socialSettings: {},
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
