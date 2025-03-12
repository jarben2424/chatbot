import { StreamingTextResponse } from 'ai';
import { OpenAI } from 'openai';
import { env } from '@/lib/env';
import { updateDocumentPrompt } from '@/lib/ai/prompts';

// Type definitions
interface DocumentInput {
  title: string;
  dataStream: WritableStream;
}

interface DocumentUpdate {
  document: {
    title: string;
    content: string;
  };
  description: string;
  dataStream: WritableStream;
}

// Create helper functions to handle document operations
const createDocumentHandler = {
  kind: 'text' as const,
  
  async onCreateDocument({ title, dataStream }: DocumentInput) {
    let draftContent = '';
    
    try {
      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY
      });
      
      // Create streaming response
      const response = await openai.chat.completions.create({
        model: env.OPENAI_MODEL || 'gpt-4o',
        stream: true,
        messages: [
          {
            role: 'system',
            content: `You are an expert at creating well formatted, structured documents on any topic.
            The user has asked you to create a document with this title: "${title}".
            Create a detailed, informative document covering this topic.
            Focus on providing valuable, accurate information that would be useful for someone wanting to learn about this topic.
            Use markdown formatting to structure your document nicely, including headings, subheadings, bullet points, and emphasis where appropriate.
            For complex topics, include examples to help illustrate key points.
            Aim for a comprehensive document that covers the main aspects of the topic in depth.`
          },
          {
            role: 'user',
            content: `Create a detailed document about ${title}.`
          }
        ],
        temperature: 0.7,
        top_p: 0.95,
      });
      
      // Create a text encoder
      const encoder = new TextEncoder();
      
      // Create a TransformStream to handle the response
      const transformStream = new TransformStream({
        async transform(chunk, controller) {
          // Append the chunk to the draft content
          draftContent += chunk;
          // Send the complete draft through the controller
          controller.enqueue(encoder.encode(draftContent));
        }
      });
      
      // Pipe the response to the transform stream
      const writer = transformStream.writable.getWriter();
      
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          await writer.write(content);
        }
      }
      
      await writer.close();
      
      // Pipe the transform stream to the data stream
      const readableStream = transformStream.readable;
      readableStream.pipeTo(dataStream);
      
      return {
        content: draftContent,
        title,
      };
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error(`Failed to create document: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
  
  async onUpdateDocument({ document, description, dataStream }: DocumentUpdate) {
    let draftContent = '';
    
    try {
      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY
      });
      
      // Create streaming response
      const response = await openai.chat.completions.create({
        model: env.OPENAI_MODEL || 'gpt-4o',
        stream: true,
        messages: [
          {
            role: 'system',
            content: updateDocumentPrompt
          },
          {
            role: 'user',
            content: `Update the document as requested.
Current title: ${document.title}
Current content:
${document.content}

Update instructions: ${description}`
          }
        ],
        temperature: 0.7,
        top_p: 0.95,
      });
      
      // Create a text encoder
      const encoder = new TextEncoder();
      
      // Create a TransformStream to handle the response
      const transformStream = new TransformStream({
        async transform(chunk, controller) {
          // Append the chunk to the draft content
          draftContent += chunk;
          // Send the complete draft through the controller
          controller.enqueue(encoder.encode(draftContent));
        }
      });
      
      // Pipe the response to the transform stream
      const writer = transformStream.writable.getWriter();
      
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          await writer.write(content);
        }
      }
      
      await writer.close();
      
      // Pipe the transform stream to the data stream
      const readableStream = transformStream.readable;
      readableStream.pipeTo(dataStream);
      
      return {
        content: draftContent,
        title: document.title,
      };
    } catch (error) {
      console.error('Error updating document:', error);
      throw new Error(`Failed to update document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// Export the document handler
export const textDocumentHandler = createDocumentHandler;
