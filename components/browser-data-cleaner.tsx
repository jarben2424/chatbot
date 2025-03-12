'use client';

import { useEffect } from 'react';

/**
 * Component that clears all browser storage on page refresh
 * This component should be added to your layout file
 */
export function BrowserDataCleaner() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    // Function to clear all browser data
    const clearAllData = () => {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage 
      sessionStorage.clear();
      
      // Clear cookies (except essential ones)
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        
        // Skip essential auth cookies if needed
        if (name === 'next-auth.session-token' || name === 'next-auth.csrf-token') {
          continue;
        }
        
        // Expire the cookie
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
      
      console.log('All browser data cleared on page refresh');
    };

    // Method 1: Use the pageshow event to detect page refresh
    window.addEventListener('pageshow', (event) => {
      // If the page is loaded from the browser cache (back/forward navigation)
      // event.persisted will be true
      if (event.persisted) {
        clearAllData();
      } else {
        // For normal navigation, check if this is a refresh
        const lastVisit = sessionStorage.getItem('lastVisitTimestamp');
        const currentTime = Date.now();
        
        // If last visit was very recent (within 3 seconds), treat as refresh
        if (lastVisit && currentTime - parseInt(lastVisit, 10) < 3000) {
          clearAllData();
        }
        
        // Update timestamp
        sessionStorage.setItem('lastVisitTimestamp', currentTime.toString());
      }
    });

    // Method 2: Save a flag before unload, then check it on load
    window.addEventListener('beforeunload', () => {
      sessionStorage.setItem('shouldClearData', 'true');
    });
    
    // Check if we should clear data from a refresh
    if (sessionStorage.getItem('shouldClearData') === 'true') {
      clearAllData();
      sessionStorage.removeItem('shouldClearData');
    }
    
    // Set initial timestamp
    sessionStorage.setItem('lastVisitTimestamp', Date.now().toString());
    
    // Clean up event listeners on component unmount
    return () => {
      window.removeEventListener('pageshow', () => {});
      window.removeEventListener('beforeunload', () => {});
    };
  }, []);

  // This component doesn't render anything
  return null;
}
