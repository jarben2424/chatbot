'use client';

import { useEffect } from 'react';
import { useArtifact } from '@/hooks/use-artifact';

/**
 * ArtifactOpener - A component that listens for custom events to open artifacts
 * This component will automatically open artifacts when triggered by a custom event
 */
export function ArtifactOpener() {
  const { setArtifact } = useArtifact();

  useEffect(() => {
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
  }, [setArtifact]);

  // This component doesn't render anything
  return null;
}

export default ArtifactOpener; 