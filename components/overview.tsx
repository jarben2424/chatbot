'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export const Overview = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // or a loading placeholder
  }

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
          <div className="w-full max-w-[320px]">
            {isDark ? (
              <Image
                src="/images/Hang-Logo-Full-White (1).png"
                alt="Hang AI"
                width={320}
                height={96}
                className="w-full h-auto"
                priority
              />
            ) : (
              <Image
                src="/images/Hang-Logo-Full-RichBlack.png"
                alt="Hang AI"
                width={320}
                height={96}
                className="w-full h-auto"
                priority
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
