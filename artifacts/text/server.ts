import { smoothStream, streamText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { updateDocumentPrompt } from '@/lib/ai/prompts';

export const textDocumentHandler = createDocumentHandler<'text'>({
  kind: 'text',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    try {
      // Try to use a model that's guaranteed to exist in your environment
      // Replace 'gpt-3.5-turbo' with a model you know is available
      const model = (() => {
        try {
          return myProvider.languageModel('artifact-model');
        } catch (error) {
          console.warn('artifact-model not found, using specific fallback model instead');
          // Specify a known available model explicitly
          try {
            return myProvider.languageModel('gpt-3.5-turbo'); // Try a common model first
          } catch (fallbackError) {
            try {
              return myProvider.languageModel('claude-3-haiku-20240307'); // Try another common model
            } catch (secondFallbackError) {
              // Final fallback - manually create content without using a model
              console.error('No available language models found');
              throw new Error('No available language models for document creation');
            }
          }
        }
      })();

      // Only attempt to use the model if one was successfully found
      const { fullStream } = streamText({
        model,
        system:
          'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
        experimental_transform: smoothStream({ chunking: 'word' }),
        prompt: title,
      });

      for await (const delta of fullStream) {
        const { type } = delta;

        if (type === 'text-delta') {
          const { textDelta } = delta;

          draftContent += textDelta;

          dataStream.writeData({
            type: 'text-delta',
            content: textDelta,
          });
        }
      }

      return draftContent;
    } catch (error) {
      console.error('Error creating document:', error);
      // Always generate fallback content when model fails
      const fallbackContent = `# ${title}\n\nContent generation is currently unavailable due to a configuration issue. Please try again later.\n\n## Document Details\n\nThis is an automatically generated placeholder for your requested document titled "${title}".`;
      
      // Send the fallback content through the data stream
      dataStream.writeData({
        type: 'text-delta',
        content: fallbackContent,
      });
      
      return fallbackContent;
    }
  },
  
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    try {
      // Try to use a model that's guaranteed to exist in your environment
      const model = (() => {
        try {
          return myProvider.languageModel('artifact-model');
        } catch (error) {
          console.warn('artifact-model not found, using specific fallback model instead');
          // Specify a known available model explicitly
          try {
            return myProvider.languageModel('gpt-3.5-turbo'); // Try a common model first
          } catch (fallbackError) {
            try {
              return myProvider.languageModel('claude-3-haiku-20240307'); // Try another common model
            } catch (secondFallbackError) {
              // Final fallback - just return the existing content
              console.error('No available language models found');
              throw new Error('No available language models for document update');
            }
          }
        }
      })();

      const { fullStream } = streamText({
        model,
        system: updateDocumentPrompt(document.content, 'text'),
        experimental_transform: smoothStream({ chunking: 'word' }),
        prompt: description,
        experimental_providerMetadata: {
          openai: {
            prediction: {
              type: 'content',
              content: document.content,
            },
          },
        },
      });

      for await (const delta of fullStream) {
        const { type } = delta;

        if (type === 'text-delta') {
          const { textDelta } = delta;

          draftContent += textDelta;
          dataStream.writeData({
            type: 'text-delta',
            content: textDelta,
          });
        }
      }

      return draftContent;
    } catch (error) {
      console.error('Error updating document:', error);
      // Return the original content if update fails, plus a note
      const errorMessage = "\n\n---\n\n*Note: Document update failed due to a configuration issue.*";
      return document.content + errorMessage;
    }
  },
});
