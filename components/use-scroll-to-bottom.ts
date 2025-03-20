import { useEffect, useRef, type RefObject } from 'react';

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T>,
  RefObject<T>,
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);
  const isUserScrollingRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set up scroll event handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!container) return;
      
      // Store the last scroll position
      lastScrollTopRef.current = container.scrollTop;
      
      // Calculate if we're close to the bottom (within 100px)
      const isNearBottom = 
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      // User is actively scrolling
      isUserScrollingRef.current = true;
      
      // Clear previous timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Reset scroll state after a short delay
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      const shouldAutoScroll = () => {
        // Don't auto-scroll if user is actively scrolling and not at the bottom
        if (isUserScrollingRef.current) {
          const isAtBottom = 
            container.scrollHeight - lastScrollTopRef.current - container.clientHeight < 100;
          return isAtBottom;
        }
        return true;
      };

      const observer = new MutationObserver(() => {
        if (shouldAutoScroll()) {
          end.scrollIntoView({ behavior: 'instant', block: 'end' });
        }
      });

      observer.observe(container, {
        childList: true,  // Watch for new messages
        subtree: false,   // Don't observe changes in message content
        attributes: false, // Don't observe attribute changes
        characterData: false, // Don't observe text changes
      });

      return () => observer.disconnect();
    }
  }, []);

  return [containerRef, endRef];
}
