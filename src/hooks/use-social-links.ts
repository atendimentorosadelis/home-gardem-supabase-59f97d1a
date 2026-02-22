import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface SocialSettings {
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
  linkedin: string;
  pinterest: string;
  tiktok: string;
  facebook_enabled: boolean;
  instagram_enabled: boolean;
  twitter_enabled: boolean;
  youtube_enabled: boolean;
  linkedin_enabled: boolean;
  pinterest_enabled: boolean;
  tiktok_enabled: boolean;
}

const defaultSocialSettings: SocialSettings = {
  facebook: '', instagram: '', twitter: '', youtube: '', linkedin: '', pinterest: '', tiktok: '',
  facebook_enabled: true, instagram_enabled: true, twitter_enabled: true, youtube_enabled: true,
  linkedin_enabled: true, pinterest_enabled: true, tiktok_enabled: true,
};

export type SocialPlatform = 'facebook' | 'instagram' | 'twitter' | 'youtube' | 'linkedin' | 'pinterest' | 'tiktok';

export function useSocialLinks() {
  const [socialLinks, setSocialLinks] = useState<SocialSettings>(defaultSocialSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = localStorage.getItem('admin_social_settings');
        if (saved) {
          try { setSocialLinks({ ...defaultSocialSettings, ...JSON.parse(saved) }); } catch (e) { console.error('Error parsing social settings:', e); }
        }

        const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'social_links').maybeSingle();
        if (error) {
          console.error('Error loading social settings:', error);
        } else if (data?.value && typeof data.value === 'object') {
          const value = data.value as Record<string, unknown>;
          const dbSettings: SocialSettings = {
            facebook: (value.facebook as string) || '', instagram: (value.instagram as string) || '',
            twitter: (value.twitter as string) || '', youtube: (value.youtube as string) || '',
            linkedin: (value.linkedin as string) || '', pinterest: (value.pinterest as string) || '',
            tiktok: (value.tiktok as string) || '',
            facebook_enabled: Boolean(value.facebook_enabled), instagram_enabled: Boolean(value.instagram_enabled),
            twitter_enabled: Boolean(value.twitter_enabled), youtube_enabled: Boolean(value.youtube_enabled),
            linkedin_enabled: Boolean(value.linkedin_enabled), pinterest_enabled: Boolean(value.pinterest_enabled),
            tiktok_enabled: Boolean(value.tiktok_enabled),
          };
          setSocialLinks(dbSettings);
          localStorage.setItem('admin_social_settings', JSON.stringify(dbSettings));
        }
      } catch (error) {
        console.error('Error loading social settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<SocialSettings>;
      setSocialLinks({ ...defaultSocialSettings, ...customEvent.detail });
    };
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin_social_settings' && e.newValue) {
        try { setSocialLinks({ ...defaultSocialSettings, ...JSON.parse(e.newValue) }); } catch (err) { console.error('Error:', err); }
      }
    };
    window.addEventListener('social-settings-updated', handleCustomEvent);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('social-settings-updated', handleCustomEvent);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const platforms: SocialPlatform[] = ['facebook', 'instagram', 'twitter', 'youtube', 'linkedin', 'pinterest', 'tiktok'];
  const activeLinks = platforms.filter((platform) => {
    const enabledKey = `${platform}_enabled` as keyof SocialSettings;
    return Boolean(socialLinks[enabledKey]);
  }).map((platform) => ({
    platform, url: socialLinks[platform] || '', hasUrl: Boolean(socialLinks[platform] && socialLinks[platform].trim() !== '')
  }));

  return { socialLinks, activeLinks, hasActiveLinks: activeLinks.length > 0, isLoading };
}
