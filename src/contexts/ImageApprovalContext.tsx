import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface ImageApprovalContextType {
  requireApproval: boolean;
  setRequireApproval: (value: boolean) => void;
}

const ImageApprovalContext = createContext<ImageApprovalContextType | undefined>(undefined);

const STORAGE_KEY = 'image-approval-enabled';

export function ImageApprovalProvider({ children }: { children: ReactNode }) {
  const [requireApproval, setRequireApproval] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requireApproval));
  }, [requireApproval]);

  return (
    <ImageApprovalContext.Provider value={{ requireApproval, setRequireApproval }}>
      {children}
    </ImageApprovalContext.Provider>
  );
}

export function useImageApproval() {
  const context = useContext(ImageApprovalContext);
  if (context === undefined) {
    throw new Error('useImageApproval must be used within an ImageApprovalProvider');
  }
  return context;
}
