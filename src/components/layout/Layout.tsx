import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

export function Layout({ children, fullWidth }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className={fullWidth ? '' : 'container mx-auto px-4 py-8'}>
        {children}
      </main>
    </div>
  );
}
