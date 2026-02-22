import React, { createContext, useContext, useState, useCallback } from 'react';

interface NavigationBlockContextType {
  isBlocked: boolean;
  blockNavigation: () => void;
  unblockNavigation: () => void;
  requestNavigation: ((path: string) => boolean) | null;
  setRequestNavigation: (fn: ((path: string) => boolean) | null) => void;
}

const NavigationBlockContext = createContext<NavigationBlockContextType | undefined>(undefined);

export function NavigationBlockProvider({ children }: { children: React.ReactNode }) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [requestNavigation, setRequestNavigationFn] = useState<((path: string) => boolean) | null>(null);

  const blockNavigation = useCallback(() => setIsBlocked(true), []);
  const unblockNavigation = useCallback(() => setIsBlocked(false), []);

  const setRequestNavigation = useCallback((fn: ((path: string) => boolean) | null) => {
    setRequestNavigationFn(() => fn);
  }, []);

  return (
    <NavigationBlockContext.Provider
      value={{ isBlocked, blockNavigation, unblockNavigation, requestNavigation, setRequestNavigation }}
    >
      {children}
    </NavigationBlockContext.Provider>
  );
}

export function useNavigationBlock() {
  const context = useContext(NavigationBlockContext);
  if (context === undefined) {
    throw new Error('useNavigationBlock must be used within a NavigationBlockProvider');
  }
  return context;
}
