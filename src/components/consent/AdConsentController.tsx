import { useEffect } from "react";
import { useConsent } from "@/contexts/ConsentContext";

/**
 * Controls loading of AdSense script based on TCF consent.
 * AdSense script in index.html should be removed; this component handles it dynamically.
 */
export function AdConsentController() {
  const { consent } = useConsent();

  useEffect(() => {
    if (!consent) return;

    if (consent.advertising) {
      // Load AdSense if not already loaded
      if (!document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
        const script = document.createElement("script");
        script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8413330105117878";
        script.async = true;
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);
      }

      // Update Google consent mode
      if ((window as any).gtag) {
        (window as any).gtag("consent", "update", {
          ad_storage: "granted",
          ad_user_data: "granted",
          ad_personalization: "granted",
        });
      }
    } else {
      // Deny ad consent
      if ((window as any).gtag) {
        (window as any).gtag("consent", "update", {
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        });
      }
    }

    // Update analytics consent
    if ((window as any).gtag) {
      (window as any).gtag("consent", "update", {
        analytics_storage: consent.analytics ? "granted" : "denied",
      });
    }
  }, [consent]);

  return null;
}
