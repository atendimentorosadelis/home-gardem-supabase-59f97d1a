import { useEffect, useState, useCallback } from 'react';

interface UseUnsavedChangesWarningReturn {
  showNavigationDialog: boolean;
  pendingNavigation: string | null;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  requestNavigation: (path: string) => boolean;
}

export function useUnsavedChangesWarning(hasUnsavedChanges: boolean): UseUnsavedChangesWarningReturn {
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; return ''; }
    };
    if (hasUnsavedChanges) window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const requestNavigation = useCallback((path: string): boolean => {
    if (hasUnsavedChanges) { setPendingNavigation(path); setShowNavigationDialog(true); return false; }
    return true;
  }, [hasUnsavedChanges]);

  const confirmNavigation = useCallback(() => {
    setShowNavigationDialog(false);
    const path = pendingNavigation;
    setPendingNavigation(null);
    if (path) window.location.href = path;
  }, [pendingNavigation]);

  const cancelNavigation = useCallback(() => { setShowNavigationDialog(false); setPendingNavigation(null); }, []);

  return { showNavigationDialog, pendingNavigation, confirmNavigation, cancelNavigation, requestNavigation };
}
