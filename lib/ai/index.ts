import { createAI, createStreamableUI, createStreamableValue } from 'ai/rsc';
import { createDocumentFromAI } from '@/lib/actions/create-document';
import { queryData, visualizeData } from '@/lib/actions/data-tools';
import { saveChat, saveMessages } from '@/lib/db/chat';
import { generateUUID } from '@/lib/utils';

// Define UI artifact types
export type UIArtifact = {
  id: string;
  type: 'visualization' | 'document' | 'query';
  title: string;
  content: any;
  status?: 'idle' | 'streaming';
};

export type UIDocument = {
  id: string;
  title: string;
  content: string;
  type: string;
};

// Create a function that submits user messages to the AI
async function submitUserMessage(content: string, chatId: string, userId: string) {
  'use server';
  
  // Create a unique message ID
  const messageId = generateUUID();

  // Create streamable values for the response
  const ui = createStreamableUI();
  const responseMessage = createStreamableValue('');
  
  // Save the user message to the database
  await saveMessages({
    messages: [{
      id: messageId,
      role: 'user',
      content,
      createdAt: new Date(),
      chatId
    }]
  });
  
  // Create or save the chat
  if (!chatId) {
    const newChatId = generateUUID();
    await saveChat({
      id: newChatId,
      userId,
      title: content.substring(0, 100)
    });
    chatId = newChatId;
  }
  
  // Make the request to the AI API
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content }],
      id: chatId
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to submit message: ${error}`);
  }
  
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  if (!reader) {
    throw new Error('Failed to create response reader');
  }

  // Process the streaming response
  let accumulatedMessage = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    // Decode and accumulate the message
    const chunk = decoder.decode(value);
    accumulatedMessage += chunk;
    
    // Update the streamable value
    responseMessage.update(accumulatedMessage);
    
    // Process function calls if any
    if (chunk.includes('function_call')) {
      try {
        // Check if this is a complete function call
        const functionCallMatch = /function_call":\s*({[^}]+})/g.exec(chunk);
        if (functionCallMatch) {
          const functionCall = JSON.parse(functionCallMatch[1]);
          
          if (functionCall.name === 'create_document') {
            const args = JSON.parse(functionCall.arguments);
            const result = await createDocumentFromAI({
              title: args.title,
              kind: args.kind
            });
            
            // Update UI with document result
            ui.update(
              <div className="document-result">
                Document created: {result.title}
              </div>
            );
          } else if (functionCall.name === 'query_data') {
            const args = JSON.parse(functionCall.arguments);
            const result = await queryData({
              query: args.query,
              description: args.description
            });
            
            // Update UI with query result
            ui.update(
              <div className="query-result">
                Query executed: {args.query}
              </div>
            );
          } else if (functionCall.name === 'visualize_data') {
            const args = JSON.parse(functionCall.arguments);
            const result = await visualizeData({
              data: args.data,
              visualization: args.visualization,
              title: args.title,
              description: args.description
            });
            
            // Update UI with visualization result
            ui.update(
              <div className="visualization-result">
                Visualization created: {args.title}
              </div>
            );
          }
        }
      } catch (error) {
        console.error('Error processing function call:', error);
      }
    }
  }
  
  // Save the final assistant message
  await saveMessages({
    messages: [{
      id: generateUUID(),
      role: 'assistant',
      content: accumulatedMessage,
      createdAt: new Date(),
      chatId
    }]
  });
  
  return {
    id: chatId,
    display: ui.value,
    content: responseMessage.value
  };
}

// Create the AI configuration
export const AI = createAI({
  actions: {
    submitUserMessage
  },
  initialAIState: {
    role: 'assistant'
  },
  initialUIState: {
    chatId: null as string | null,
    messages: [],
    documents: [] as UIDocument[],
    artifacts: [] as UIArtifact[]
  }
}); 