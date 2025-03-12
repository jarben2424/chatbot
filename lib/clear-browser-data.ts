'use client';

/**
 * Utility to clear all browser storage data
 * Includes: localStorage, sessionStorage, and cookies
 */

/**
 * Clears all localStorage data
 */
export function clearLocalStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.clear();
    console.log('LocalStorage cleared');
  }
}

/**
 * Clears all sessionStorage data
 */
export function clearSessionStorage(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.clear();
    console.log('SessionStorage cleared');
  }
}

/**
 * Clears all cookies
 */
export function clearCookies(): void {
  if (typeof window !== 'undefined') {
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      
      // Skip essential cookies if needed
      if (name === 'next-auth.session-token' || name === 'next-auth.csrf-token') {
        continue;
      }
      
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
    
    console.log('Cookies cleared');
  }
}

/**
 * Clears all browser data (localStorage, sessionStorage, and non-essential cookies)
 */
export function clearAllBrowserData(): void {
  clearLocalStorage();
  clearSessionStorage();
  clearCookies();
  console.log('All browser data cleared');
}

/**
 * Set up auto-clearing of browser data on page refresh
 * Call this function in your app's main layout or entry component
 */
export function setupAutoClearBrowserData(): void {
  if (typeof window !== 'undefined') {
    // Store a timestamp in sessionStorage to detect page refresh
    const lastLoadTime = sessionStorage.getItem('lastLoadTime');
    const currentTime = Date.now().toString();
    
    if (lastLoadTime) {
      // This is a page refresh, clear the data
      clearAllBrowserData();
    }
    
    // Update the timestamp for next check
    sessionStorage.setItem('lastLoadTime', currentTime);
    
    // Alternative approach using beforeunload event
    window.addEventListener('beforeunload', () => {
      sessionStorage.setItem('clearOnNextLoad', 'true');
    });
    
    // Check if we need to clear data from beforeunload flag
    if (sessionStorage.getItem('clearOnNextLoad') === 'true') {
      clearAllBrowserData();
      sessionStorage.removeItem('clearOnNextLoad');
    }
  }
}
