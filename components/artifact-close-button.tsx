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
        // Check if we're closing a specific document kind
        const isVisualization = artifact.kind === 'visualization';
        const isSegment = artifact.kind === 'segment';
        const artifactId = artifact.documentId;
        
        // Log which artifact was closed to help with debugging
        console.log(`Closing ${artifact.kind} document:`, artifactId);
        
        // For all document types, handle closure consistently
        setArtifact((currentArtifact) => {
          // For all document types, just set isVisible to false to collapse them initially
          // This provides consistent behavior across all document types
          console.log(`Setting ${currentArtifact.kind} document to invisible:`, artifactId);
          
          if (currentArtifact.status === 'streaming') {
            // If document is still streaming, just hide it but keep state
            return {
              ...currentArtifact,
              isVisible: false,
            };
          } else if (isVisualization) {
            // For visualizations, maintain some state for potential restoration
            return {
              ...currentArtifact,
              isVisible: false,
            };
          } else {
            // For completed non-visualization documents, fully reset
            return { ...initialArtifactData, status: 'idle' };
          }
        });
        
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
