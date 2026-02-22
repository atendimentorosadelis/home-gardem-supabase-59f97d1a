import { useState, useEffect, useRef } from "react";

interface UseCountUpOptions {
  end: number;
  duration?: number;
  startOnView?: boolean;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function useCountUp({ end, duration = 2000, startOnView = true }: UseCountUpOptions) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasStartedRef = useRef(false);
  const animationRef = useRef<number | null>(null);
  const endRef = useRef(end);
  const durationRef = useRef(duration);

  endRef.current = end;
  durationRef.current = duration;

  useEffect(() => {
    const startAnimation = () => {
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;

      const startTime = performance.now();
      const targetEnd = endRef.current;
      const targetDuration = durationRef.current;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / targetDuration, 1);
        const easedProgress = easeOutExpo(progress);

        setCount(Math.floor(easedProgress * targetEnd));

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setCount(targetEnd);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    };

    if (!startOnView) {
      startAnimation();
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStartedRef.current) {
            startAnimation();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [startOnView]);

  return { count, ref };
}
