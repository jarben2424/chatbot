'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LoaderIcon } from 'lucide-react';

export function TransitionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDestination, setLoadingDestination] = useState('');
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Listen for navigation events
  useEffect(() => {
    // Function to handle Next.js navigation
    const handleRouteChangeStart = (url: string) => {
      // Only set loading for certain route changes like dashboards
      if (url.includes('/dashboards/') && url !== pathname) {
        setIsLoading(true);
        setLoadingDestination(url);
        
        // Set a timeout to clear the loading state if navigation takes too long
        const timeout = setTimeout(() => {
          setIsLoading(false);
        }, 8000); // 8 seconds timeout
        
        setLoadingTimeout(timeout);
      }
    };

    // Function to handle navigation complete
    const handleRouteChangeComplete = () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
      setIsLoading(false);
    };

    // Add event listeners for Next.js navigation events
    if (typeof window !== 'undefined') {
      // Use a MutationObserver as a workaround to detect page changes
      // since Next.js App Router doesn't expose navigation events
      const observer = new MutationObserver((mutations) => {
        const currentPath = window.location.pathname;
        if (currentPath !== pathname) {
          // The path has changed
          handleRouteChangeComplete();
        }
      });
      
      // Watch for changes to the document body
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Listen for clicks on dashboard links
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const link = target.closest('a');
        if (link && link.href && link.href.includes('/dashboards/')) {
          handleRouteChangeStart(link.href);
        }
      });
      
      return () => {
        observer.disconnect();
        if (loadingTimeout) clearTimeout(loadingTimeout);
      };
    }
  }, [pathname, loadingTimeout]);

  return (
    <>
      {children}
      
      {/* Loading indicator overlay - only shown when loading */}
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-16 flex justify-center items-center bg-background/80 backdrop-blur-sm z-50 shadow">
          <div className="flex items-center gap-3">
            <LoaderIcon className="animate-spin h-5 w-5 text-primary" />
            <span className="text-sm font-medium">
              Loading {loadingDestination.split('/').pop()?.replace(/-/g, ' ')}...
            </span>
          </div>
        </div>
      )}
    </>
  );
} 