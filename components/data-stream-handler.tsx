'use client';

import { useEffect, useRef } from 'react';
import { artifactDefinitions, ArtifactKind } from './artifact';
import { Suggestion } from '@/lib/db/schema';
import { initialArtifactData, useArtifact } from '@/hooks/use-artifact';

export type DataStreamDelta = {
  type:
    | 'text-delta'
    | 'code-delta'
    | 'sheet-delta'
    | 'image-delta'
    | 'visualization-data'
    | 'title'
    | 'id'
    | 'suggestion'
    | 'clear'
    | 'finish'
    | 'kind'
    | 'artifact'
    | 'force-artifact-visible'
    | 'client-script'
    | 'raw-html'
    | 'content-update';
  content: string | Suggestion | Record<string, unknown>;
  textDelta?: string;
};

export function DataStreamHandler({
  dataStream,
}: {
  dataStream: Array<any>;
}) {
  const { artifact, setArtifact, setMetadata } = useArtifact();
  const lastProcessedIndex = useRef(-1);

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    (newDeltas as DataStreamDelta[]).forEach((delta: DataStreamDelta) => {
      const artifactDefinition = artifactDefinitions.find(
        (artifactDefinition) => artifactDefinition.kind === artifact.kind,
      );

      if (artifactDefinition?.onStreamPart) {
        artifactDefinition.onStreamPart({
          streamPart: delta,
          setArtifact,
          setMetadata,
        });
      }

      setArtifact((draftArtifact) => {
        if (!draftArtifact) {
          return { ...initialArtifactData, status: 'streaming' };
        }

        switch (delta.type) {
          case 'id':
            return {
              ...draftArtifact,
              documentId: delta.content as string,
              status: 'streaming',
            };

          case 'title':
            return {
              ...draftArtifact,
              title: delta.content as string,
              status: 'streaming',
            };
            
          case 'text-delta':
            try {
              // Find the latest assistant message container to append text
              const textContainer = document.querySelector('.group[data-message-role="assistant"]:last-child .message-content') || 
                                    document.querySelector('.group[data-message-role="assistant"]:last-child .prose');
              
              if (textContainer) {
                // Create a paragraph for the text
                const textElement = document.createElement('p');
                textElement.textContent = delta.textDelta || delta.content as string;
                textElement.style.margin = '10px 0';
                textContainer.appendChild(textElement);
              }
            } catch (textError) {
              console.error('Error processing text delta:', textError);
            }
            return draftArtifact;

          case 'raw-html':
            try {
              console.log('Received raw HTML content');
              
              // Create a container for the HTML content
              const div = document.createElement('div');
              div.innerHTML = delta.content as string;
              
              // Make it visible within the chat stream
              div.style.display = 'block';
              div.style.width = '100%';
              div.style.margin = '10px 0';
              div.style.maxWidth = '100%';
              div.style.boxSizing = 'border-box';
              
              // Find the most recent AI message container to append to
              const messageContainer = document.querySelector('.group[data-message-role="assistant"]:last-child .message-content') || 
                                      document.querySelector('.group[data-message-role="assistant"]:last-child .prose') || 
                                      document.querySelector('.group:last-child .prose');
              
              console.log('Found message container:', messageContainer ? 'yes' : 'no');
              
              if (messageContainer) {
                // Move the div into the message container
                messageContainer.appendChild(div);
                
                // Execute any scripts
                const scripts = div.getElementsByTagName('script');
                for (let i = 0; i < scripts.length; i++) {
                  try {
                    const script = document.createElement('script');
                    script.text = scripts[i].textContent || '';
                    document.body.appendChild(script);
                    document.body.removeChild(script);
                  } catch (scriptError) {
                    console.error('Error executing embedded script:', scriptError);
                  }
                }
                
                // Set the reportRequested flag in sessionStorage
                try {
                  if (window.sessionStorage) {
                    window.sessionStorage.setItem('reportRequested', 'true');
                    console.log('Report requested flag set via data stream handler');
                  }
                } catch (e) {
                  console.error('Error setting sessionStorage flag:', e);
                }
              } else {
                // Fallback - add to body and position above the input area
                const inputContainer = document.querySelector('form');
                if (inputContainer && inputContainer.parentNode) {
                  inputContainer.parentNode.insertBefore(div, inputContainer);
                } else {
                  document.body.appendChild(div);
                }
              }
            } catch (htmlError) {
              console.error('Error processing raw HTML:', htmlError);
            }
            return draftArtifact;

          case 'client-script':
            try {
              console.log('Executing client script from stream');
              const scriptContent = delta.content as string;
              const scriptFunc = new Function(scriptContent);
              scriptFunc();
            } catch (scriptError) {
              console.error('Error executing client script:', scriptError);
            }
            return draftArtifact;

          case 'artifact':
            const artifactData = delta.content as any;
            console.log('Received artifact signal:', artifactData);
            
            // If the artifact has autoFocus or shouldOpen flags, dispatch an event to open it
            if (artifactData.autoFocus || artifactData.shouldOpen) {
              try {
                // Dispatch a custom event that will be caught by the ArtifactOpener
                const event = new CustomEvent('artifact-signal', {
                  detail: artifactData
                });
                window.dispatchEvent(event);
                console.log('Dispatched artifact-signal event for direct opening');
              } catch (e) {
                console.error('Error dispatching artifact event:', e);
              }
            }
            
            return {
              ...draftArtifact,
              ...artifactData,
              isVisible: true,
              status: artifactData.status || 'idle',
            };

          case 'force-artifact-visible':
            const visibilityData = delta.content as any;
            console.log('Received force visibility signal:', visibilityData);
            
            // If the artifact has autoFocus or shouldOpen flags, dispatch an event to open it
            if (visibilityData.autoFocus || visibilityData.shouldOpen) {
              try {
                // Dispatch a custom event that will be caught by the ArtifactOpener
                const event = new CustomEvent('artifact-signal', {
                  detail: visibilityData
                });
                window.dispatchEvent(event);
                console.log('Dispatched artifact-signal event for direct opening (force)');
              } catch (e) {
                console.error('Error dispatching artifact event:', e);
              }
            }
            
            setTimeout(() => {
              setArtifact(current => ({
                ...current,
                ...visibilityData,
                isVisible: true,
              }));
            }, 100);
            
            return {
              ...draftArtifact,
              ...visibilityData,
              isVisible: true,
              status: 'idle',
            };

          case 'kind':
            return {
              ...draftArtifact,
              kind: delta.content as ArtifactKind,
              status: 'streaming',
            };

          case 'clear':
            return {
              ...draftArtifact,
              content: '',
              status: 'streaming',
            };

          case 'finish':
            return {
              ...draftArtifact,
              status: 'idle',
            };

          case 'content-update':
            // If we have an active document, update it
            if (draftArtifact && draftArtifact.documentId) {
              return {
                ...draftArtifact,
                content: (draftArtifact.content || '') + (delta.content as string),
              };
            }
            return draftArtifact;

          default:
            return draftArtifact;
        }
      });
    });
  }, [dataStream, setArtifact, setMetadata, artifact]);

  return null;
}
