import { forwardRef, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface AIIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const sizeClasses = { xs: 'h-3 w-3', sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' };

export const AIIcon = forwardRef<HTMLSpanElement, AIIconProps>(
  ({ className, size = 'md', ...props }, ref) => {
    return <span ref={ref} className={cn(sizeClasses[size], 'inline-flex items-center justify-center text-primary font-bold', className)} {...props}>AI</span>;
  }
);

AIIcon.displayName = 'AIIcon';
