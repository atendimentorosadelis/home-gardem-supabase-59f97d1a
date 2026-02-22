import { useParallax } from '@/hooks/use-parallax';

interface ArticleHeroProps {
  image: string;
  title: string;
}

export function ArticleHero({ image, title }: ArticleHeroProps) {
  const parallaxOffset = useParallax(0.4);

  return (
    <div className="relative h-[60vh] min-h-[500px] w-full overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-glow z-[1]" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-primary/15 rounded-full blur-[100px] animate-pulse-glow z-[1]" />

      {/* Image with Parallax */}
      <div
        className="absolute inset-0 w-full h-[120%] -top-[10%]"
        style={{
          transform: `translateY(${parallaxOffset}px)`,
        }}
      >
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover scale-110"
        />
      </div>
    </div>
  );
}
