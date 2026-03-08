import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Facebook Pixel - Full integration following Facebook Ads guidelines.
 * 
 * Standard Events tracked automatically:
 * - PageView: every route change (SPA-aware)
 * - ViewContent: article pages (with content_name, content_category, content_type)
 * - Search: blog/search pages with query params
 * 
 * Events tracked via fbqTrack() helper (called from forms):
 * - Lead: newsletter subscription
 * - Contact: contact form submission
 * - CompleteRegistration: user signup
 * 
 * Consent: Respects TCF v2.3 advertising consent.
 */

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

// Global helper for tracking from any component
export function fbqTrack(eventName: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, params);
  }
}

export function fbqTrackCustom(eventName: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", eventName, params);
  }
}

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
          if (
            value.facebook_pixel_id &&
            typeof value.facebook_pixel_id === "string" &&
            value.facebook_pixel_enabled === true
          ) {
            setPixelId(value.facebook_pixel_id);
          }
        }
      } catch {
        // silent
      }
    }
    return () => {
      if (typeof id === "number") clearTimeout(id);
    };
  }, []);

  // Inject pixel base code
  useEffect(() => {
    if (!pixelId) return;

    // Check TCF consent for advertising
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

    // noscript fallback
    const noscript = document.createElement("noscript");
    const img = document.createElement("img");
    img.height = 1;
    img.width = 1;
    img.style.display = "none";
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);
  }, [pixelId]);

  // Track SPA route changes with standard events
  useEffect(() => {
    if (!pixelId || !window.fbq) return;

    const path = location.pathname;

    // PageView on every navigation
    window.fbq("track", "PageView");

    // ViewContent on article pages (pattern: /:categorySlug/:postId)
    const articleMatch = path.match(/^\/([^/]+)\/([^/]+)$/);
    if (
      articleMatch &&
      !["admin", "blog", "about", "contact", "privacy-policy", "terms-of-use", "cookie-policy", "unsubscribe", "garden-tips", "indoor-plants", "manuals"].includes(articleMatch[1])
    ) {
      window.fbq("track", "ViewContent", {
        content_type: "article",
        content_category: articleMatch[1],
        content_name: decodeURIComponent(articleMatch[2]),
      });
    }

    // Search event on blog with search params
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get("q") || searchParams.get("search") || searchParams.get("busca");
    if (searchQuery && (path === "/blog" || path === "/garden-tips" || path === "/indoor-plants" || path === "/manuals")) {
      window.fbq("track", "Search", {
        search_string: searchQuery,
        content_category: path.replace("/", "") || "blog",
      });
    }
  }, [location.pathname, location.search, pixelId]);

  return null;
}
