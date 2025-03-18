import { DataStreamWriter, tool } from 'ai';
import { Session } from 'next-auth';
import { z } from 'zod';
import { getDocumentById, saveDocument } from '@/lib/db/queries';
import { documentHandlersByArtifactKind } from '@/lib/artifacts/server';
import { toast } from 'sonner';

interface UpdateDocumentProps {
  session: Session;
  dataStream: DataStreamWriter;
}

export const updateDocument = ({ session, dataStream }: UpdateDocumentProps) =>
  tool({
    description: 'Update a document with the given description.',
    parameters: z.object({
      id: z.string().describe('The ID of the document to update'),
      description: z
        .string()
        .describe('The description of changes that need to be made'),
    }),
    execute: async ({ id, description }) => {
      try {
        const document = await getDocumentById({ id });

        if (!document) {
          return {
            error: 'Document not found',
          };
        }

        dataStream.writeData({
          type: 'clear',
          content: document.title,
        });

        const documentHandler = documentHandlersByArtifactKind.find(
          (documentHandlerByArtifactKind) =>
            documentHandlerByArtifactKind.kind === document.kind,
        );

        if (!documentHandler) {
          throw new Error(`No document handler found for kind: ${document.kind}`);
        }

        await documentHandler.onUpdateDocument({
          document,
          description,
          dataStream,
          session,
        });

        dataStream.writeData({ type: 'finish', content: '' });

        return {
          id,
          title: document.title,
          kind: document.kind,
          content: 'The document has been updated successfully.',
        };
      } catch (error) {
        // Log the error
        console.error('Error in updateDocument:', error);
        
        // Don't try to show toast on the server
        // The toast will be handled by the client component instead
        
        // Return a graceful error response
        return {
          id,
          kind: 'text',
          title: 'Update failed',
          content: 'The document could not be updated at this time.',
          error: 'I finally fixed this big bug so I think the rest of the prototype should be straight forward. So I\'m going to align with Ethan and then nap for a little.'
        };
      }
    },
  });
