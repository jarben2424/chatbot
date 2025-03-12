'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedTransitionProps {
  children: ReactNode
  type?: 'fade' | 'slide' | 'scale' | 'none'
  duration?: number
  className?: string
}

export function AnimatedTransition({
  children,
  type = 'fade',
  duration = 0.5,
  className = ''
}: AnimatedTransitionProps) {
  // Define animation variants based on type
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slide: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 }
    },
    none: {
      initial: {},
      animate: {},
      exit: {}
    }
  }

  const selectedVariant = variants[type]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={JSON.stringify(children)} // Force re-render on children change
        initial={selectedVariant.initial}
        animate={selectedVariant.animate}
        exit={selectedVariant.exit}
        transition={{ duration }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
} 