'use client';

import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  showAfterMs?: number;
}

export function LoadingOverlay({ 
  isLoading, 
  text = 'Loading...', 
  showAfterMs = 300 
}: LoadingOverlayProps) {
  const [shouldShow, setShouldShow] = useState(false);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isLoading) {
      timeout = setTimeout(() => setShouldShow(true), showAfterMs);
    } else {
      setShouldShow(false);
    }
    
    return () => clearTimeout(timeout);
  }, [isLoading, showAfterMs]);
  
  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card shadow-lg border"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">{text}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 