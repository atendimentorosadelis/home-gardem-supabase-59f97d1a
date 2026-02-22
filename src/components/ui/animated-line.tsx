import { cn } from "@/lib/utils";

interface AnimatedLineProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function AnimatedLine({ children, delay = 0, className }: AnimatedLineProps) {
  return (
    <span className="block overflow-hidden pb-[0.1em]">
      <span
        className={cn(
          "block will-change-transform [animation-fill-mode:both]",
          className
        )}
        style={{
          animationDelay: `${delay}ms`,
          animationName: 'reveal-up',
          animationDuration: '1s',
          animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          transform: 'translateY(110%)'
        }}
      >
        {children}
      </span>
    </span>
  );
}
