import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITEMAP_URL = "https://homegardenmanual.com/sitemap.xml";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const results: Record<string, string> = {};

    // Ping Google
    try {
      const googleRes = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`);
      results.google = googleRes.ok ? "OK" : `Error: ${googleRes.status}`;
      console.log(`Google ping: ${results.google}`);
    } catch (e) {
      results.google = `Failed: ${e.message}`;
      console.error("Google ping failed:", e.message);
    }

    // Ping Bing/IndexNow
    try {
      const bingRes = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`);
      results.bing = bingRes.ok ? "OK" : `Error: ${bingRes.status}`;
      console.log(`Bing ping: ${results.bing}`);
    } catch (e) {
      results.bing = `Failed: ${e.message}`;
      console.error("Bing ping failed:", e.message);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Sitemap ping sent to search engines",
      results,
      pinged_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Ping error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
