'use client';

import { useEffect } from 'react';

export function DocumentErrorHandler() {
  useEffect(() => {
    // Listen for AI errors and dispatch them as custom events
    const handleAIError = (error) => {
      if (error.message?.includes('createDocument') || error.toolName === 'createDocument') {
        // Dispatch a document tool error event
        window.dispatchEvent(
          new CustomEvent('document-tool-error', {
            detail: {
              message: error.message,
              toolName: error.toolName,
              cause: error.cause
            }
          })
        );
      }
    };

    // Add global error handler
    const handleUnhandledRejection = (event) => {
      if (event.reason?.message?.includes('createDocument')) {
        handleAIError(event.reason);
      }
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // This component doesn't render anything
  return null;
} 