'use client';

import { useEffect, useState } from 'react';
import { useArtifact } from '@/hooks/use-artifact';

// Extend global Window interface to include our direct open function
declare global {
  interface Window {
    directOpenDocument?: (documentId: string, title: string, kind: string) => void;
    debugArtifactOpener?: {
      logCurrentState: () => void;
      setArtifactForId: (id: string, title: string) => boolean | void;
      forceVisibility: () => string;
    };
    openDocumentDirectly?: (documentId: string, title: string, kind?: string) => boolean;
  }
}

/**
 * ArtifactOpener - A component that listens for custom events to open artifacts
 * This component will automatically open artifacts when triggered by a custom event
 */
export function ArtifactOpener() {
  const { setArtifact } = useArtifact();
  const [lastOpenAttempt, setLastOpenAttempt] = useState('');

  // Debug log to console when component mounts
  useEffect(() => {
    console.log('ArtifactOpener component mounted');
    
    // Log the document opening function to the global scope for easier debugging/access
    (window as any).debugArtifactOpener = {
      logCurrentState: () => {
        console.log('Current state:', {
          lastOpenAttempt,
          reportRequested: typeof window !== 'undefined' ? sessionStorage.getItem('reportRequested') : null,
          lastDocumentId: typeof window !== 'undefined' ? sessionStorage.getItem('lastDocumentId') : null
        });
      },
      setArtifactForId: (id: string, title: string) => {
        console.log('Debug setting artifact for:', id);
        // Use the enhanced visibility function
        return forceArtifactVisibility(id, title || 'Report', 'text');
      },
      forceVisibility: () => {
        try {
          const artifactContainers = document.querySelectorAll('.artifact, [class*="artifact"], [data-artifact], [data-document-id]');
          artifactContainers.forEach(container => {
            if (container instanceof HTMLElement) {
              container.style.display = 'flex';
              container.style.visibility = 'visible';
              container.style.opacity = '1';
            }
          });
          return 'Forced visibility on ' + artifactContainers.length + ' elements';
        } catch(e) {
          return 'Error: ' + String(e);
        }
      }
    };
    
    return () => {
      console.log('ArtifactOpener component unmounting');
      delete (window as any).debugArtifactOpener;
    };
  }, [setArtifact, lastOpenAttempt]);

  // Set up polling for new documents to open them automatically
  useEffect(() => {
    // Make sure this only runs in browser
    if (typeof window === 'undefined') return;
    
    let pollingInterval: NodeJS.Timeout;
    
    // Only start polling when a report has been explicitly requested
    const reportRequested = sessionStorage.getItem('reportRequested');
    const lastDocumentId = sessionStorage.getItem('lastDocumentId');
    
    if (reportRequested) {
      // If we have a specific document ID saved, try to open it directly first
      if (lastDocumentId && lastDocumentId !== lastOpenAttempt) {
        console.log('Found direct document ID to open:', lastDocumentId);
        try {
          // Open the document directly using our enhanced function
          forceArtifactVisibility(lastDocumentId, 'Report', 'text');
          
          // Clean up storage
          sessionStorage.removeItem('reportRequested');
          sessionStorage.removeItem('lastDocumentId');
          
          return; // Skip polling
        } catch (e) {
          console.error('Error opening direct document:', e);
          // Continue with polling as fallback
        }
      }
      
      // Poll every 2 seconds, but only for a limited time
      let pollCount = 0;
      const maxPolls = 10; // Maximum 20 seconds of polling
      
      console.log('Starting polling for recent documents');
      
      pollingInterval = setInterval(async () => {
        try {
          pollCount++;
          
          // Stop polling after max attempts
          if (pollCount >= maxPolls) {
            clearInterval(pollingInterval);
            sessionStorage.removeItem('reportRequested');
            console.log('Stopped polling for new documents - max attempts reached');
            return;
          }
          
          // Check for newly created documents
          const response = await fetch('/api/document/recent');
          
          if (response.ok) {
            const documents = await response.json();
            
            // If we found documents and we haven't tried to open the most recent yet
            if (Array.isArray(documents) && documents.length > 0 && documents[0].id !== lastOpenAttempt) {
              const mostRecent = documents[0];
              
              // Format createdAt correctly depending on whether it's a string or Date
              const createdAt = typeof mostRecent.createdAt === 'string' 
                ? new Date(mostRecent.createdAt) 
                : mostRecent.createdAt;
                
              const timeDiff = Date.now() - createdAt.getTime();
              
              // If document was created in the last 30 seconds (30000ms)
              if (timeDiff < 30000) {
                console.log('Found recently created document to open:', mostRecent);
                
                // Check if this is actually a report by verifying it's a text document
                if (mostRecent.kind === 'text') {
                  // Open the document
                  setArtifact(currentArtifact => ({
                    ...currentArtifact,
                    documentId: mostRecent.id,
                    title: mostRecent.title,
                    kind: mostRecent.kind,
                    isVisible: true,
                    status: 'idle',
                  }));
                  
                  // Remember this document so we don't try to open it again
                  setLastOpenAttempt(mostRecent.id);
                  
                  // Clear the flag since we've found a document
                  sessionStorage.removeItem('reportRequested');
                  
                  // Stop polling
                  clearInterval(pollingInterval);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error polling for recent documents:', error);
        }
      }, 2000);
    }
    
    // Clean up
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [setArtifact, lastOpenAttempt]);

  // Also keep the existing event listener
  useEffect(() => {
    // Make sure this only runs in browser
    if (typeof window === 'undefined') return;
    
    // Function to handle custom 'openArtifact' events
    const handleOpenArtifact = (event: CustomEvent) => {
      try {
        const { documentId, title, kind } = event.detail;
        console.log('Received openArtifact event:', event.detail);
        
        if (!documentId || !title || !kind) {
          console.error('Missing required properties in openArtifact event');
          return;
        }
        
        // Update the artifact to make it visible
        setArtifact(currentArtifact => ({
          ...currentArtifact,
          documentId,
          title,
          kind,
          isVisible: true,
          status: 'idle',
        }));
        
        // Remember this document ID so polling doesn't try to open it again
        setLastOpenAttempt(documentId);
        
        console.log('Artifact opened successfully:', documentId);
      } catch (error) {
        console.error('Error handling openArtifact event:', error);
      }
    };

    // Add event listener for custom 'openArtifact' events
    window.addEventListener('openArtifact', handleOpenArtifact as EventListener);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('openArtifact', handleOpenArtifact as EventListener);
    };
  }, [setArtifact, setLastOpenAttempt]);

  // Also keep the existing event listener for manually opening documents
  useEffect(() => {
    // Make sure this only runs in browser
    if (typeof window === 'undefined') return;
    
    // Listen for artifact content signals from the data stream
    const handleArtifactSignal = (event: CustomEvent) => {
      try {
        const { documentId, title, kind, autoFocus, shouldOpen } = event.detail || {};
        
        // Only proceed if we have the required fields and either autoFocus or shouldOpen is true
        if (documentId && title && kind && (autoFocus || shouldOpen)) {
          console.log('Received artifact signal with autoFocus/shouldOpen:', event.detail);
          
          // Use our enhanced visibility function instead of just updating state
          forceArtifactVisibility(documentId, title, kind);
          
          console.log('Artifact opened directly via signal:', documentId);
        }
      } catch (error) {
        console.error('Error handling artifact signal:', error);
      }
    };
    
    // Add event listener for artifact signals
    window.addEventListener('artifact-signal', handleArtifactSignal as EventListener);
    
    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('artifact-signal', handleArtifactSignal as EventListener);
    };
  }, [setArtifact, setLastOpenAttempt]);

  // Also register a direct openArtifact event handler
  useEffect(() => {
    // Make sure this only runs in browser
    if (typeof window === 'undefined') return;
    
    // Create a function to directly open a document
    const directOpenDocument = (documentId: string, title: string, kind: string) => {
      console.log('Direct document open request:', documentId);
      
      if (!documentId || !title || !kind) {
        console.error('Missing required properties for direct document open');
        return;
      }
      
      // Use our enhanced visibility function
      forceArtifactVisibility(documentId, title, kind);
      
      console.log('Document opened directly:', documentId);
      
      // Clean up storage
      try {
        if (window.sessionStorage) {
          sessionStorage.removeItem('reportRequested');
          sessionStorage.removeItem('lastDocumentId');
        }
      } catch (e) {
        console.error('Error cleaning up sessionStorage:', e);
      }
    };
    
    // Register the direct open function on the window
    (window as any).directOpenDocument = directOpenDocument;
    
    // Clean up
    return () => {
      delete (window as any).directOpenDocument;
    };
  }, [setArtifact, setLastOpenAttempt]);

  // Direct function to ensure artifacts are visible
  const forceArtifactVisibility = (documentId: string, title: string, kind: string) => {
    try {
      console.log('Force making artifact visible for:', documentId);
      
      // 1. Update state through hook
      setArtifact(currentArtifact => ({
        ...currentArtifact,
        documentId,
        title,
        kind: (kind === 'text' || kind === 'code' || kind === 'image' || 
               kind === 'sheet' || kind === 'visualization') 
               ? kind : 'text',
        isVisible: true,
        status: 'idle',
      }));
      
      // 2. Try direct DOM manipulation to ensure visibility
      setTimeout(() => {
        try {
          // Find and force artifactContainer to be visible
          const artifactContainers = document.querySelectorAll('.artifact, [class*="artifact"], [data-artifact], [data-document-id]');
          
          artifactContainers.forEach(container => {
            if (container instanceof HTMLElement) {
              // Force visibility
              container.style.display = 'flex';
              container.style.visibility = 'visible';
              container.style.opacity = '1';
              container.style.pointerEvents = 'auto';
              
              // Add the documentId attribute
              container.setAttribute('data-document-id', documentId);
              
              // Remove any hidden classes
              container.classList.remove('hidden', 'invisible');
              
              // Add visible classes if they exist
              container.classList.add('visible', 'isVisible');
              
              console.log('Made artifact container visible:', container);
            }
          });
          
          // Check for React component with artifact class
          const artifactComponent = document.querySelector('[class*="artifact_container"]');
          if (artifactComponent instanceof HTMLElement) {
            artifactComponent.style.display = 'flex';
            artifactComponent.style.visibility = 'visible';
            console.log('Made React artifact container visible');
          }
        } catch (e) {
          console.error('Error in DOM visibility forcing:', e);
        }
      }, 100);
      
      // Remember this document to prevent duplicate opening
      setLastOpenAttempt(documentId);
      
      return true;
    } catch (e) {
      console.error('Error in forceArtifactVisibility:', e);
      return false;
    }
  };

  // Create a direct method that attempts to open any document immediately
  const openDocument = (documentId: string, title: string, kind: string = 'text') => {
    if (!documentId) return false;
    
    console.log('Direct document open requested:', documentId);
    
    // Normalize the kind to a valid value
    const safeKind = (kind === 'text' || kind === 'code' || kind === 'image' || 
                    kind === 'sheet' || kind === 'visualization') 
                    ? kind : 'text';
    
    // Update artifact state to make it visible
    setArtifact(currentArtifact => ({
      ...currentArtifact,
      documentId,
      title,
      kind: safeKind,
      isVisible: true,
      status: 'idle',
    }));
    
    // Remember we tried to open this document
    setLastOpenAttempt(documentId);
    
    // Return success
    return true;
  };

  // Register the direct open method so other components can use it
  useEffect(() => {
    // Define a helper function that can be called from the message component
    window.openDocumentDirectly = openDocument;
    
    return () => {
      delete window.openDocumentDirectly;
    };
  }, []);

  // This component doesn't render anything
  return null;
}

export default ArtifactOpener; 