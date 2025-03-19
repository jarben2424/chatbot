'use client';

import { AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface TransitionLayoutProps {
  children: ReactNode;
}

export function TransitionLayout({ children }: TransitionLayoutProps) {
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  
  // Wait for initial render to avoid hydration issues
  useEffect(() => {
    setIsReady(true);
  }, []);
  
  if (!isReady) {
    return <>{children}</>;
  }
  
  return (
    <AnimatePresence mode="wait">
      <div key={pathname} className="flex w-full h-full">
        {children}
      </div>
    </AnimatePresence>
  );
} 