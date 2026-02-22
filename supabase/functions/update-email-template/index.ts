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
    const { templateId } = await req.json();

    if (!templateId) {
      throw new Error("Template ID is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Unset all defaults for this category
    const { error: unsetError } = await supabase
      .from("email_templates")
      .update({ is_default: false })
      .eq("category", "contact_reply");

    if (unsetError) {
      console.error("Error unsetting defaults:", unsetError);
      throw unsetError;
    }

    // Set the new default
    const { error: setError } = await supabase
      .from("email_templates")
      .update({ is_default: true })
      .eq("id", templateId);

    if (setError) {
      console.error("Error setting default:", setError);
      throw setError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Template set as default successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in update-email-template:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
