import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    const trackPageView = async () => {
      try {
        const viewerHash = btoa(navigator.userAgent + new Date().toDateString());
        await (supabase as any).from('page_views').insert({
          page_path: location.pathname,
          page_title: document.title,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          viewer_hash: viewerHash,
        });
      } catch {
        // silently fail
      }
    };

    trackPageView();
  }, [location.pathname]);

  return null;
}
