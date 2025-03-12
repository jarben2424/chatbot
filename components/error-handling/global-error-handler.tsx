'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

interface GlobalErrorHandlerProps {
  children: React.ReactNode;
}

export function GlobalErrorHandler({ children }: GlobalErrorHandlerProps) {
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Prevent the default browser error display
      event.preventDefault();
      
      // Show toast message
      toast({
        title: 'Something went wrong',
        description: event.reason?.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    };

    // Handle uncaught JavaScript errors
    const handleError = (event: ErrorEvent) => {
      console.error('Uncaught error:', event.error);
      
      // Prevent the default browser error display
      event.preventDefault();
      
      // Show toast message
      toast({
        title: 'Something went wrong',
        description: event.error?.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [toast]);

  return <>{children}</>;
} 