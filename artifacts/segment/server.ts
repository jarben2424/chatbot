import { myProvider } from '@/lib/ai/providers';
import { getSystemPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { streamObject } from 'ai';
import { z } from 'zod';

// Define the schema for a customer segment
const segmentSchema = z.object({
  segment: z.object({
    name: z.string().describe('A descriptive name for the segment'),
    description: z.string().describe('Detailed description of what this segment represents'),
    criteria: z.array(z.object({
      field: z.string().describe('The field to filter on (e.g., purchase_amount, last_purchase_date)'),
      operator: z.string().describe('Comparison operator (e.g., equals, greater_than, contains)'),
      value: z.union([z.string(), z.number()]).describe('The value to compare against')
    }))
  })
});

export const segmentDocumentHandler = createDocumentHandler<'segment'>({
  kind: 'segment',
  onCreateDocument: async ({ title, dataStream }) => {
    try {
      // Create a system prompt for generating customer segments
      const systemPrompt = `You are an expert in customer segmentation and analytics. 
Your task is to create a customer segment definition based on the title or description provided.
A good customer segment should:
1. Have clear, measurable criteria
2. Target a specific group of customers with similar behaviors or attributes
3. Be actionable for marketing or business purposes
4. Have a descriptive name and explanation

Create a segment definition with the following structure:
- name: A clear, concise name for the segment
- description: A detailed explanation of what this segment represents and why it's valuable
- criteria: An array of conditions that define this segment (field, operator, value)`;

      const { fullStream } = streamObject({
        model: myProvider.languageModel('gpt-3.5-turbo'),
        system: systemPrompt,
        prompt: `Create a customer segment based on this description: "${title}"`,
        schema: segmentSchema,
      });

      let draftContent = '';

      for await (const delta of fullStream) {
        const { type } = delta;

        if (type === 'object') {
          const { object } = delta;
          const { segment } = object;

          if (segment) {
            // Convert to JSON string with formatting
            const segmentJson = JSON.stringify(segment, null, 2);
            
            dataStream.writeData({
              type: 'text-delta',
              content: segmentJson,
            });

            draftContent = segmentJson;
          }
        }
      }

      dataStream.writeData({
        type: 'text-delta',
        content: draftContent,
      });

      return draftContent;
    } catch (error) {
      console.error('Error creating segment document:', error);
      throw new Error('Failed to create segment document due to an internal error.');
    }
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    try {
      // Parse the existing segment to use as context
      const existingSegment = JSON.parse(document.content || '{}');
      
      const updatePrompt = `You are updating an existing customer segment. 
The current segment definition is:
\`\`\`json
${document.content}
\`\`\`

Modify this segment based on the following instruction: "${description}"

Keep the same general structure but update the segment according to the instruction.`;

      const { fullStream } = streamObject({
        model: myProvider.languageModel('gpt-3.5-turbo'),
        system: updatePrompt,
        prompt: description,
        schema: segmentSchema,
      });

      let draftContent = '';

      for await (const delta of fullStream) {
        const { type } = delta;

        if (type === 'object') {
          const { object } = delta;
          const { segment } = object;

          if (segment) {
            // Convert to JSON string with formatting
            const segmentJson = JSON.stringify(segment, null, 2);
            
            dataStream.writeData({
              type: 'text-delta',
              content: segmentJson,
            });

            draftContent = segmentJson;
          }
        }
      }

      return draftContent;
    } catch (error) {
      console.error('Error updating segment document:', error);
      
      // Return the original content if there's an error
      return document.content || '';
    }
  },
});
