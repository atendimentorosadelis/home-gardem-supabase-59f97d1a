import { Facebook, Instagram, Twitter, Youtube, Linkedin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSocialLinks, SocialPlatform } from '@/hooks/use-social-links';

export { type SocialPlatform } from '@/hooks/use-social-links';

export const PinterestIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.805-2.425 1.808-2.425.852 0 1.264.64 1.264 1.408 0 .858-.546 2.14-.828 3.33-.235.995.499 1.806 1.48 1.806 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.176-4.068-2.845 0-4.516 2.135-4.516 4.34 0 .859.331 1.781.745 2.281a.3.3 0 0 1 .069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
  </svg>
);

export const TikTokIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const platformIcons: Record<SocialPlatform, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
  pinterest: PinterestIcon,
  tiktok: TikTokIcon,
};

interface SocialLinksProps {
  className?: string;
  iconClassName?: string;
}

export function SocialLinks({ className, iconClassName = "w-5 h-5" }: SocialLinksProps) {
  const { activeLinks } = useSocialLinks();

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {activeLinks.map(({ platform, url, hasUrl }) => {
        const Icon = platformIcons[platform];
        const Wrapper = hasUrl ? 'a' : 'span';
        const linkProps = hasUrl ? { href: url, target: "_blank", rel: "noopener noreferrer" } : {};
        return (
          <Wrapper
            key={platform}
            {...linkProps}
            className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            aria-label={platform}
          >
            <Icon className={iconClassName} />
          </Wrapper>
        );
      })}
    </div>
  );
}
