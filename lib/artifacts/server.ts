import { z } from 'zod';
import { DataStreamWriter } from 'ai';
import { Session } from 'next-auth';

import { textDocumentHandler } from './text/server';
import { codeDocumentHandler } from './code/server';
import { sheetDocumentHandler } from './sheet/server';
import { imageDocumentHandler } from './image/server';

export const artifactKinds = ['text', 'code', 'sheet', 'image'] as const;

export type ArtifactKind = (typeof artifactKinds)[number];

export const artifactKindSchema = z.enum(artifactKinds);

export const documentHandlersByArtifactKind = [
  textDocumentHandler,
  codeDocumentHandler,
  sheetDocumentHandler,
  imageDocumentHandler,
];

export interface DocumentHandlerContext {
  id: string;
  title: string;
  dataStream: DataStreamWriter;
  session: Session;
}

export interface DocumentHandler {
  kind: ArtifactKind;
  onCreateDocument: (context: DocumentHandlerContext) => Promise<void>;
}
