'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTheme } from 'next-themes';

export const Overview = () => {
  const { resolvedTheme } = useTheme();

  const logoSrc = resolvedTheme === 'dark' 
    ? '/images/Hang-Logo-Full-White.png'
    : '/images/Hang-Logo-Full-RichBlack.png';

  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <div className="flex justify-center">
          <Image
            src={logoSrc}
            alt="Hang Logo"
            width={200}
            height={50}
            priority
          />
        </div>
      </div>
    </motion.div>
  );
};
