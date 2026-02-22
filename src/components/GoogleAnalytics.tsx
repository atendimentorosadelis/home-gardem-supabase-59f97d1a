import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_GA_ID = "G-5TZK11NWMC";

export function GoogleAnalytics() {
  const [gaId, setGaId] = useState<string>(FALLBACK_GA_ID);

  useEffect(() => {
    async function fetchGaId() {
      try {
        const { data, error } = await (supabase as any)
          .from("site_settings")
          .select("value")
          .eq("key", "seo_settings")
          .maybeSingle();

        if (!error && data?.value && typeof data.value === "object") {
          const value = data.value as Record<string, unknown>;
          if (value.google_analytics_id && typeof value.google_analytics_id === "string") {
            setGaId(value.google_analytics_id);
          }
        }
      } catch {
        // Use fallback
      }
    }
    fetchGaId();
  }, []);

  useEffect(() => {
    if (!gaId) return;
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${gaId}"]`)) return;

    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    script.async = true;
    document.head.appendChild(script);

    const inlineScript = document.createElement("script");
    inlineScript.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    `;
    document.head.appendChild(inlineScript);
  }, [gaId]);

  return null;
}
