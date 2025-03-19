'use client';

import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOptimisticLoading } from '@/components/providers/optimistic-loading-provider';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

type TransitionVariant = 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'fade' | 'zoom';

interface SeamlessPageTransitionProps {
  children: ReactNode;
  variant?: TransitionVariant;
  className?: string;
  loadingType?: 'dashboard' | 'campaign' | 'default';
  initialPath?: string;
}

// Edge-to-edge transition variants
const variants = {
  'slide-left': {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '-100%' }
  },
  'slide-right': {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '100%' }
  },
  'slide-up': {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '-100%' }
  },
  'slide-down': {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '100%' }
  },
  'fade': {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  'zoom': {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 }
  }
};

export function SeamlessPageTransition({ 
  children, 
  variant = 'slide-left', 
  className = '',
  loadingType = 'default',
  initialPath
}: SeamlessPageTransitionProps) {
  const { isLoading, setIsLoading, getPreloadedData } = useOptimisticLoading();
  
  // Check if we have preloaded data for this path
  useEffect(() => {
    if (initialPath) {
      const preloadedData = getPreloadedData(initialPath);
      if (preloadedData) {
        // If we have preloaded data, we can skip the loading state
        setIsLoading(false);
      }
    }
  }, [initialPath, getPreloadedData, setIsLoading]);
  
  return (
    <div className="relative flex-1 overflow-hidden">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 w-full h-full"
          >
            <LoadingSkeleton type={loadingType} />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            variants={variants[variant]}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 30
            }}
            className={`absolute inset-0 w-full h-full ${className}`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}