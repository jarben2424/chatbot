import { myProvider } from '@/lib/ai/providers';
import { getSystemPrompt, sheetPrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { streamObject } from 'ai';
import { z } from 'zod';

export const sheetDocumentHandler = createDocumentHandler<'sheet'>({
  kind: 'sheet',
  onCreateDocument: async ({ title, dataStream }) => {
    try {
      const { fullStream } = streamObject({
        model: myProvider.languageModel('correct-model-id'),
        system: getSystemPrompt(sheetPrompt, title),
        prompt: title,
        schema: z.object({
          csv: z.string().describe('CSV data'),
        }),
      });

      let draftContent = '';

      for await (const delta of fullStream) {
        const { type } = delta;

        if (type === 'object') {
          const { object } = delta;
          const { csv } = object;

          if (csv) {
            dataStream.writeData({
              type: 'sheet-delta',
              content: csv,
            });

            draftContent = csv;
          }
        }
      }

      dataStream.writeData({
        type: 'sheet-delta',
        content: draftContent,
      });

      return draftContent;
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error('Failed to create document due to an internal error.');
    }
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(document.content, 'sheet'),
      prompt: description,
      schema: z.object({
        csv: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { csv } = object;

        if (csv) {
          dataStream.writeData({
            type: 'sheet-delta',
            content: csv,
          });

          draftContent = csv;
        }
      }
    }

    return draftContent;
  },
});
