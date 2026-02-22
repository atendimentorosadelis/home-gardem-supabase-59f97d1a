import { useState, useCallback, useEffect } from 'react';
import { Images, RefreshCw, ZoomIn } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface AIImageGalleryProps {
  images: Array<{ url: string; prompt: string }>;
  isLoading: boolean;
  error: string | null;
  onRegenerate?: () => void;
  count?: number;
  showRegenerate?: boolean;
}

export function AIImageGallery({ images, isLoading, error, onRegenerate, count = 6, showRegenerate = false }: AIImageGalleryProps) {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [skipTransition, setSkipTransition] = useState(false);

  const handlePrev = useCallback(() => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  }, [selectedIndex]);

  const handleNext = useCallback(() => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  }, [selectedIndex, images.length]);

  if (error && !isLoading && images.length === 0) {
    return null;
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') setSelectedIndex(null);
  };

  const handleDragStart = (clientX: number) => {
    if (isAnimating) return;
    setDragStart(clientX);
    setIsDragging(true);
  };

  const handleDragMove = (clientX: number) => {
    if (dragStart === null || !isDragging || isAnimating) return;
    const offset = clientX - dragStart;
    if (selectedIndex === 0 && offset > 0) {
      setDragOffset(offset * 0.3);
    } else if (selectedIndex === images.length - 1 && offset < 0) {
      setDragOffset(offset * 0.3);
    } else {
      setDragOffset(offset);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging || isAnimating || selectedIndex === null) return;
    const screenWidth = window.innerWidth;
    const threshold = screenWidth * 0.3;
    const goingNext = dragOffset < -threshold;
    const goingPrev = dragOffset > threshold;
    const canNavigate = (goingNext && selectedIndex < images.length - 1) || (goingPrev && selectedIndex > 0);

    setIsDragging(false);
    setDragStart(null);

    if (canNavigate) {
      setIsAnimating(true);
      const newIndex = goingNext ? selectedIndex + 1 : selectedIndex - 1;
      setDragOffset(goingNext ? -screenWidth : screenWidth);
      setTimeout(() => {
        setSkipTransition(true);
        setSelectedIndex(newIndex);
        setDragOffset(0);
        requestAnimationFrame(() => {
          setSkipTransition(false);
          setIsAnimating(false);
        });
      }, 300);
    } else {
      setIsAnimating(true);
      setDragOffset(0);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => { e.preventDefault(); handleDragStart(e.clientX); };
  const handleMouseMove = (e: React.MouseEvent) => { handleDragMove(e.clientX); };
  const handleMouseUp = () => { handleDragEnd(); };
  const handleTouchStart = (e: React.TouchEvent) => { handleDragStart(e.touches[0].clientX); };
  const handleTouchMove = (e: React.TouchEvent) => { handleDragMove(e.touches[0].clientX); };
  const handleTouchEnd = () => { handleDragEnd(); };

  return (
    <div className="my-12 p-6 bg-card/50 rounded-2xl border border-border backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Images className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">{t('gallery.title')}</h3>
        </div>
        {showRegenerate && !isLoading && images.length > 0 && onRegenerate && (
          <Button variant="ghost" size="sm" onClick={onRegenerate} className="text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('gallery.regenerate')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: count }).map((_, i) => (
            <div key={i} className="relative aspect-video rounded-xl overflow-hidden">
              <Skeleton className="w-full h-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-muted-foreground">{t('gallery.generating')}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          images.map((image, i) => (
            <div key={i} className="group relative aspect-video rounded-xl overflow-hidden cursor-pointer" onClick={() => setSelectedIndex(i)}>
              <img src={image.url} alt={`${t('gallery.imageAlt')} ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                  <ZoomIn className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent
          className="max-w-6xl p-0 bg-black/95 border-none overflow-hidden [&>button]:text-white [&>button]:opacity-100 [&>button]:hover:opacity-70"
          onKeyDown={handleKeyDown}
        >
          {selectedIndex !== null && images[selectedIndex] && (
            <div className="relative flex flex-col items-center justify-center min-h-[60vh]">
              <div className="absolute top-4 left-4 text-white/70 text-sm z-10">
                {selectedIndex + 1} / {images.length}
              </div>
              <div
                className="relative w-full flex items-center justify-center overflow-hidden min-h-[50vh]"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {selectedIndex > 0 && (isDragging || isAnimating) && dragOffset > 0 && (
                  <img
                    src={images[selectedIndex - 1].url}
                    alt={t('gallery.enlargedAlt')}
                    className="w-full h-auto max-h-[85vh] object-contain select-none absolute top-1/2 left-0 -translate-y-1/2"
                    style={{ transform: `translateX(${dragOffset - window.innerWidth}px) translateY(-50%)`, transition: isDragging || skipTransition ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)' }}
                    draggable={false}
                  />
                )}
                <img
                  src={images[selectedIndex].url}
                  alt={t('gallery.enlargedAlt')}
                  className={cn("w-full h-auto max-h-[85vh] object-contain select-none", isDragging ? "cursor-grabbing" : "cursor-grab")}
                  style={{ transform: `translateX(${dragOffset}px)`, transition: isDragging || skipTransition ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)' }}
                  draggable={false}
                />
                {selectedIndex < images.length - 1 && (isDragging || isAnimating) && dragOffset < 0 && (
                  <img
                    src={images[selectedIndex + 1].url}
                    alt={t('gallery.enlargedAlt')}
                    className="w-full h-auto max-h-[85vh] object-contain select-none absolute top-1/2 left-0 -translate-y-1/2"
                    style={{ transform: `translateX(${dragOffset + window.innerWidth}px) translateY(-50%)`, transition: isDragging || skipTransition ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)' }}
                    draggable={false}
                  />
                )}
                {isDragging && images.length > 1 && (
                  <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-8 pointer-events-none">
                    <div className={cn("text-white text-4xl transition-opacity duration-150", dragOffset > window.innerWidth * 0.15 && selectedIndex > 0 ? "opacity-60" : "opacity-20")}>‹</div>
                    <div className={cn("text-white text-4xl transition-opacity duration-150", dragOffset < -window.innerWidth * 0.15 && selectedIndex < images.length - 1 ? "opacity-60" : "opacity-20")}>›</div>
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto max-w-full">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => !isAnimating && setSelectedIndex(i)}
                      className={cn("w-12 h-8 rounded overflow-hidden border-2 transition-all flex-shrink-0", i === selectedIndex ? "border-primary scale-110" : "border-transparent opacity-60 hover:opacity-100")}
                    >
                      <img src={img.url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
