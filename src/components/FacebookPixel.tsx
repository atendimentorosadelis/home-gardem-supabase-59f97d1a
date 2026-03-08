import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function FacebookPixel() {
  const [pixelId, setPixelId] = useState<string>("");
  const location = useLocation();

  // Load pixel ID from DB
  useEffect(() => {
    const id = requestIdleCallback?.(() => fetchPixelId()) ?? setTimeout(fetchPixelId, 3000);
    async function fetchPixelId() {
      try {
        const { data, error } = await (supabase as any)
          .from("site_settings")
          .select("value")
          .eq("key", "seo_settings")
          .maybeSingle();

        if (!error && data?.value && typeof data.value === "object") {
          const value = data.value as Record<string, unknown>;
          if (value.facebook_pixel_id && typeof value.facebook_pixel_id === "string" && value.facebook_pixel_enabled !== false) {
            setPixelId(value.facebook_pixel_id);
          }
        }
      } catch {
        // silent
      }
    }
    return () => { if (typeof id === "number") clearTimeout(id); };
  }, []);

  // Inject pixel script
  useEffect(() => {
    if (!pixelId) return;

    // Check consent
    const consentRaw = localStorage.getItem("tcf_consent_v2.3");
    let advertisingAllowed = false;
    if (consentRaw) {
      try {
        const consent = JSON.parse(consentRaw);
        advertisingAllowed = consent.advertising === true;
      } catch {}
    }

    if (!advertisingAllowed) return;

    // Avoid duplicate injection
    if (document.querySelector('script[data-fb-pixel]')) return;

    const script = document.createElement("script");
    script.setAttribute("data-fb-pixel", "true");
    script.textContent = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    // Also add noscript fallback
    const noscript = document.createElement("noscript");
    const img = document.createElement("img");
    img.height = 1;
    img.width = 1;
    img.style.display = "none";
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);
  }, [pixelId]);

  // Track SPA route changes
  useEffect(() => {
    if (!pixelId || !(window as any).fbq) return;
    (window as any).fbq("track", "PageView");
  }, [location.pathname, location.search, pixelId]);

  return null;
}
