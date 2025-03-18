import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SparklesIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingAnalysisButtonProps {
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  label?: string;
}

export function FloatingAnalysisButton({
  onClick,
  position = 'bottom-right',
  label = 'Analyze chart'
}: FloatingAnalysisButtonProps) {
  // Define position styles
  const positionStyles = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <motion.div
      className={cn(
        "fixed z-50",
        positionStyles[position]
      )}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <Button
        onClick={onClick}
        size="lg"
        className="rounded-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-6"
      >
        <SparklesIcon className="mr-2 h-4 w-4" />
        {label}
      </Button>
    </motion.div>
  );
} 