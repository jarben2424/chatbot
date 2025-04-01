import React from 'react';
import type { UIArtifact } from '@/components/artifact';

/**
 * ArtifactHandlerBase defines the base properties that are common to all artifact handlers.
 */
export interface ArtifactHandlerBase<Kind extends string> {
  kind: Kind;
  icon: React.ReactNode;
  render: (props: {
    artifact: UIArtifact;
    saveArtifact: (content: string, artifactId: string) => void;
  }) => React.ReactNode;
  onStreamDelta: (props: {
    content: string;
    setArtifact: (
      updater: (prev: Record<string, UIArtifact>) => Record<string, UIArtifact>
    ) => void;
    artifactId: string;
  }) => void;
}

/**
 * Type for artifact handlers used on the client side
 */
export type ArtifactHandler<Kind extends string = string> = ArtifactHandlerBase<Kind>;
