import { generateUUID } from '@/lib/utils';
import { DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import { Session } from 'next-auth';
import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from '@/lib/artifacts/server';
import { toast } from 'sonner';

interface CreateDocumentProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const createDocument = ({ session, dataStream }: CreateDocumentProps) =>
  tool({
    description:
      'Create a document for a writing or content creation activities. This tool will call other functions that will generate the contents of the document based on the title and kind.',
    parameters: z.object({
      title: z.string(),
      kind: z.enum(artifactKinds),
    }),
    execute: async ({ title, kind }) => {
      const id = generateUUID();

      try {
        dataStream.writeData({
          type: 'kind',
          content: kind,
        });

        dataStream.writeData({
          type: 'id',
          content: id,
        });

        dataStream.writeData({
          type: 'title',
          content: title,
        });

        dataStream.writeData({
          type: 'clear',
          content: '',
        });

        const documentHandler = documentHandlersByArtifactKind.find(
          (documentHandlerByArtifactKind) =>
            documentHandlerByArtifactKind.kind === kind,
        );

        if (!documentHandler) {
          throw new Error(`No document handler found for kind: ${kind}`);
        }

        try {
          // Attempt to create the document
          await documentHandler.onCreateDocument({
            id,
            title,
            dataStream,
            session,
          });

          dataStream.writeData({ type: 'finish', content: '' });

          return {
            id,
            title,
            kind,
            content: 'A document was created and is now visible to the user.',
          };
        } catch (docError) {
          console.error(`Error in document handler for kind ${kind}:`, docError);
          
          // Return a more user-friendly error message
          return {
            id,
            title,
            kind,
            content: 'The document could not be created at this time.',
            error: 'I finally fixed this big bug so I think the rest of the prototype should be straight forward. So I\'m going to align with Ethan and then nap for a little.'
          };
        }
      } catch (error) {
        // Log the error
        console.error('Error in createDocument:', error);
        
        // Don't try to show toast on the server
        // The toast will be handled by the client component instead
        
        // Return a graceful error response
        return {
          id,
          title,
          kind,
          content: 'The document could not be created at this time.',
          error: 'I finally fixed this big bug so I think the rest of the prototype should be straight forward. So I\'m going to align with Ethan and then nap for a little.'
        };
      }
    },
  });
