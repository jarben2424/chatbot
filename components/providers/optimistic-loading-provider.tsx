'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// This interface defines the structure of our loading context
interface OptimisticLoadingContextType {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  preloadedData: Record<string, any>;
  preloadPage: (path: string, data: any) => void;
  getPreloadedData: (path: string) => any;
  optimisticNavigate: (path: string) => void;
}

const OptimisticLoadingContext = createContext<OptimisticLoadingContextType | undefined>(undefined);

export function OptimisticLoadingProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [preloadedData, setPreloadedData] = useState<Record<string, any>>({});

  // Add data to preloaded cache for a specific path
  const preloadPage = useCallback((path: string, data: any) => {
    setPreloadedData(prev => ({
      ...prev,
      [path]: data
    }));
  }, []);

  // Get preloaded data for a specific path
  const getPreloadedData = useCallback((path: string) => {
    return preloadedData[path];
  }, [preloadedData]);

  // Navigate to a page and set loading state
  const optimisticNavigate = useCallback((path: string) => {
    setIsLoading(true);
    
    // Use setTimeout to ensure the loading state can render before navigation
    setTimeout(() => {
      router.push(path);
      
      // End loading state after a short delay to allow for smooth transitions
      setTimeout(() => {
        setIsLoading(false);
      }, 200);
    }, 50);
  }, [router]);

  return (
    <OptimisticLoadingContext.Provider
      value={{
        isLoading,
        setIsLoading,
        preloadedData,
        preloadPage,
        getPreloadedData,
        optimisticNavigate
      }}
    >
      {children}
    </OptimisticLoadingContext.Provider>
  );
}

export function useOptimisticLoading() {
  const context = useContext(OptimisticLoadingContext);
  if (context === undefined) {
    throw new Error('useOptimisticLoading must be used within an OptimisticLoadingProvider');
  }
  return context;
} 