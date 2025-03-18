import { memo } from 'react';
import { CrossIcon } from './icons';
import { Button } from './ui/button';
import { initialArtifactData, useArtifact } from '@/hooks/use-artifact';

function PureArtifactCloseButton() {
  const { setArtifact, artifact } = useArtifact();

  return (
    <Button
      variant="outline"
      className="h-fit p-2 dark:hover:bg-zinc-700"
      onClick={() => {
        // Check if we're closing a visualization
        const isVisualization = artifact.kind === 'visualization';
        const artifactId = artifact.documentId;
        
        // First, reset the artifact state
        setArtifact((currentArtifact) =>
          currentArtifact.status === 'streaming'
            ? {
                ...currentArtifact,
                isVisible: false,
              }
            : { ...initialArtifactData, status: 'idle' },
        );
        
        // After closing a visualization editor, trigger events to restore the query card
        if (isVisualization) {
          try {
            // First, notify that the visualization is closed to unhide the query card
            const closeEvent = new CustomEvent('visualizationClosed', {
              detail: { 
                artifactId, 
                restoreQueryCard: true,
                restoreChart: true // Ensure we restore to chart view, not data table
              }
            });
            window.dispatchEvent(closeEvent);
            
            // Short delay between events to ensure proper sequence
            setTimeout(() => {
              // Then restore any visualization data/settings
              const restoreEvent = new CustomEvent('restoreVisualization', {
                detail: { 
                  artifactId, 
                  restoreChart: true,
                  data: null // We don't have any updated data to restore
                }
              });
              window.dispatchEvent(restoreEvent);
            }, 50);
          } catch (error) {
            console.error('Error dispatching visualization close events:', error);
          }
        }
      }}
    >
      <CrossIcon size={18} />
    </Button>
  );
}

export const ArtifactCloseButton = memo(PureArtifactCloseButton, () => true);
