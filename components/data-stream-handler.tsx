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
    | 'client-script';
  content: string | Suggestion | Record<string, unknown>;
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
            return {
              ...draftArtifact,
              ...artifactData,
              isVisible: true,
              status: artifactData.status || 'idle',
            };

          case 'force-artifact-visible':
            const visibilityData = delta.content as any;
            console.log('Received force visibility signal:', visibilityData);
            
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

          default:
            return draftArtifact;
        }
      });
    });
  }, [dataStream, setArtifact, setMetadata, artifact]);

  return null;
}
