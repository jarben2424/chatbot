'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type TransitionVariant = 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'fade' | 'zoom';

interface PageTransitionProps {
  children: ReactNode;
  variant?: TransitionVariant;
  className?: string;
}

// Variants for different transition animations
const variants = {
  'slide-left': {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-50%', opacity: 0 }
  },
  'slide-right': {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '50%', opacity: 0 }
  },
  'slide-up': {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-50%', opacity: 0 }
  },
  'slide-down': {
    initial: { y: '-100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '50%', opacity: 0 }
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

export function PageTransition({ 
  children, 
  variant = 'slide-left', 
  className = ''
}: PageTransitionProps) {
  return (
    <motion.div
      variants={variants[variant]}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 30,
        duration: 0.3
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
} 