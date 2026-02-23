import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    
    let logoData: Uint8Array;
    
    if (body.base64) {
      // Accept base64 encoded image data
      const raw = body.base64.replace(/^data:image\/\w+;base64,/, '');
      const binaryStr = atob(raw);
      logoData = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        logoData[i] = binaryStr.charCodeAt(i);
      }
      console.log(`Logo from base64, size: ${logoData.length}`);
    } else {
      // Try fetching from various sources
      const urls = [
        "https://blank-canvas-maker-5273.lovable.app/logo-email.png",
        "https://id-preview--fecf1416-8f7b-4a3f-9ab6-50a212b00b07.lovable.app/logo-email.png",
      ];
      
      let fetched = false;
      for (const url of urls) {
        try {
          console.log(`Trying: ${url}`);
          const res = await fetch(url, { 
            headers: { "User-Agent": "Mozilla/5.0", "Accept": "image/*" },
            redirect: "follow",
          });
          console.log(`Status: ${res.status}, Content-Type: ${res.headers.get('content-type')}`);
          if (res.ok) {
            const ct = res.headers.get('content-type') || '';
            if (ct.includes('image')) {
              const ab = await res.arrayBuffer();
              logoData = new Uint8Array(ab);
              console.log(`Got logo: ${logoData.length} bytes`);
              fetched = true;
              break;
            }
          }
          await res.text();
        } catch (e) {
          console.log(`Error fetching ${url}:`, e);
        }
      }
      
      if (!fetched) {
        throw new Error("Could not fetch logo. Send base64 in body instead.");
      }
    }

    const { data, error } = await supabase.storage
      .from("site-assets")
      .upload("logo-email.png", logoData!, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) throw error;

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/site-assets/logo-email.png`;

    return new Response(
      JSON.stringify({ success: true, url: publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown" }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, status: 500 }
    );
  }
});
