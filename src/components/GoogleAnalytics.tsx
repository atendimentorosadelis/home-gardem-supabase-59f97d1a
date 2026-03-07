import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_GA_ID = "G-5TZK11NWMC";

export function GoogleAnalytics() {
  const [gaId, setGaId] = useState<string>(FALLBACK_GA_ID);

  useEffect(() => {
    const id = requestIdleCallback?.(() => fetchGaId()) ?? setTimeout(fetchGaId, 3000);
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
    return () => { if (typeof id === 'number') clearTimeout(id); };
  }, []);

  useEffect(() => {
    if (!gaId) return;

    // Check consent before loading GA
    const consentRaw = localStorage.getItem("tcf_consent_v2.3");
    let analyticsAllowed = false;
    if (consentRaw) {
      try {
        const consent = JSON.parse(consentRaw);
        analyticsAllowed = consent.analytics === true;
      } catch {}
    }

    if (!analyticsAllowed) {
      // Set GA to denied mode
      if (!(window as any).gtag) {
        const inlineScript = document.createElement("script");
        inlineScript.textContent = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied'
          });
        `;
        document.head.appendChild(inlineScript);
      }
      return;
    }

    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${gaId}"]`)) return;

    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    script.async = true;
    document.head.appendChild(script);

    const inlineScript = document.createElement("script");
    inlineScript.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('consent', 'default', {
        'analytics_storage': 'granted',
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted'
      });
      gtag('js', new Date());
      gtag('config', '${gaId}', { send_page_view: false });
    `;
    document.head.appendChild(inlineScript);
  }, [gaId]);

  // Track SPA route changes
  const location = useLocation();
  useEffect(() => {
    if (!gaId || !(window as any).gtag) return;
    (window as any).gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_title: document.title,
    });
  }, [location.pathname, location.search, gaId]);

  return null;
}
