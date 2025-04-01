import { generateUUID } from '@/lib/utils';
import type { Session } from 'next-auth';
import { z } from 'zod';

// Define the tool props interface
interface ToolProps {
  session: Session;
  dataStream: any;
}

export type CreateSegmentProps = ToolProps & {
  session: Session;
  dataStream: any; // Stream callback for tool invocations
};

/**
 * Creates a new segment document for customer segmentation.
 * This tool is used by the AI to create segment documents that can be further edited by users.
 */
export const createSegment = ({ session, dataStream }: CreateSegmentProps) => ({
  name: 'createSegment',
    description: 'Create a customer segment document for targeted marketing.',
    parameters: z.object({
      title: z.string().describe('The title of the segment, e.g., "High-Value Customers"'),
      description: z.string().optional().describe('An optional description of what this segment represents'),
    }),
    execute: async ({ title, description }: { title: string; description?: string }) => {
      const id = generateUUID();

      // Use self-referential absolute URL to ensure proper URL parsing
      const res = await fetch(new URL('/api/document', 'http://localhost:3000').href, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // Include credentials to send cookies for auth
        credentials: 'include',
        body: JSON.stringify({
          id,
          title,
          kind: 'segment',
          userId: session?.user?.id // Include user ID in the body
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(`Failed to create segment: ${error}`);
      }

      const segmentPrompt = description ? 
        `Create a customer segment named "${title}" with the following description: ${description}` : 
        `Create a customer segment named "${title}"`;

      // Use self-referential absolute URL to ensure proper URL parsing
      const documentRes = await fetch(new URL(`/api/document/${id}`, 'http://localhost:3000').href, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        // Include credentials to send cookies for auth
        credentials: 'include',
        body: JSON.stringify({
          prompt: segmentPrompt,
          userId: session?.user?.id // Include user ID in the body
        }),
      });

      if (!documentRes.ok) {
        const { error } = await documentRes.json();
        throw new Error(`Failed to generate segment content: ${error}`);
      }

      // Send signals to create and auto-expand the segment editor
      dataStream.append({
        type: 'kind',
        content: 'segment',
      });
      
      dataStream.append({
        type: 'id',
        content: id,
      });
      
      dataStream.append({
        type: 'title',
        content: title,
      });
      
      // Set default content for the segment editor
      const defaultContent = JSON.stringify({
        name: title,
        description: description || '',
        criteria: [
          {
            field: 'purchase_amount',
            operator: 'greater_than',
            value: 100
          }
        ]
      }, null, 2);
      
      dataStream.append({
        type: 'content-update',
        content: defaultContent,
      });
      
      // Signal to auto-expand the artifact
      dataStream.append({
        type: 'force-artifact-visible',
        content: {
          documentId: id,
          title,
          kind: 'segment',
          autoFocus: true,
          shouldOpen: true,
          isVisible: true
        },
      });
      
      dataStream.append({
        type: 'finish',
        content: '',
      });
      
      return {
        id,
        title,
        content: defaultContent,
        kind: 'segment' as const,
      };
    },
  });
