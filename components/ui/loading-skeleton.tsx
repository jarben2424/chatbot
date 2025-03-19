'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  type?: 'dashboard' | 'campaign' | 'default';
}

export function LoadingSkeleton({ type = 'default' }: LoadingSkeletonProps) {
  if (type === 'dashboard') {
    return <DashboardSkeleton />;
  } else if (type === 'campaign') {
    return <CampaignSkeleton />;
  }
  
  return <DefaultSkeleton />;
}

function DefaultSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 h-full w-full">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-48 w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 h-full w-full">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-8 w-24" />
      </div>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
      >
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

function CampaignSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 h-full w-full">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
      >
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </motion.div>
    </div>
  );
}