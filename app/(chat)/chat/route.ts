import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { getSystemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
  getChatsByUserId,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../actions';
import { myProvider } from '@/lib/ai/providers';
import { dataTools } from '@/lib/ai/tools/data-tools';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { buildReport, buildReportTool } from '@/lib/ai/tools/report-builder';
import { checkRateLimit } from '@/lib/rate-limit';

// These are some helper tools we use to format the chat route response
const getWeatherTool = getWeather;

// Function to directly send commands to open artifacts
const directlyOpenArtifact = (dataStream: any, documentInfo: { id: string; title: string; kind: string; }) => {
  try {
    // Send multiple signals to ensure the artifact opens correctly
    
    // First signal - direct artifact with autoFocus flag
    dataStream.writeData({
      type: 'artifact',
      content: {
        documentId: documentInfo.id,
        title: documentInfo.title,
        kind: documentInfo.kind,
        isVisible: true,
        status: 'idle',
        autoFocus: true,
        shouldOpen: true
      }
    });
    
    // Second signal after a delay to ensure UI has updated
    setTimeout(() => {
      try {
        dataStream.writeData({
          type: 'force-artifact-visible',
          content: {
            documentId: documentInfo.id,
            title: documentInfo.title,
            kind: documentInfo.kind,
            isVisible: true,
            status: 'idle',
            autoFocus: true,
            shouldOpen: true
          }
        });
      } catch (e) {
        console.error('Error sending delayed open signal:', e);
      }
    }, 800);
    
    // Also send a client script to force open using JavaScript
    dataStream.writeData({
      type: 'client-script',
      content: `
        try {
          if (typeof window !== 'undefined') {
            console.log('Executing client-side artifact opener for ${documentInfo.id}');
            
            // Dispatch a custom event for the ArtifactOpener
            const openEvent = new CustomEvent('artifact-signal', {
              detail: {
                documentId: '${documentInfo.id}',
                title: '${documentInfo.title.replace(/'/g, "\\'")}',
                kind: '${documentInfo.kind}',
                isVisible: true,
                autoFocus: true,
                shouldOpen: true
              }
            });
            
            // Dispatch now and also after a small delay
            window.dispatchEvent(openEvent);
            setTimeout(() => window.dispatchEvent(openEvent), 1000);
          }
        } catch (e) {
          console.error('Error in client artifact opener:', e);
        }
      `
    });
  } catch (error) {
    console.error('Error in directlyOpenArtifact:', error);
  }
};

// Chat endpoint - POST /chat
export async function POST(request: Request) {
  try {
    const { id, messages } = await request.json();
    const session = await auth();

    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Check rate limit before processing
    const rate = await checkRateLimit();
    if (!rate.allowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        details: `You have ${rate.remaining} requests remaining today.`
      }), { status: 429 });
    }

    const userMessage = getMostRecentUserMessage(messages);
    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    // Save chat and message
    const chat = await getChatById({ id });
    if (!chat) {
      const title = await generateTitleFromUserMessage({ message: typeof userMessage === 'string' ? userMessage : userMessage.content });
      await saveChat({ 
        id, 
        userId: session.user.id, 
        title
      });
    }

    // Save the user message
    await saveMessages({
      messages: [{ 
        id: generateUUID(),
        chatId: id,
        role: typeof userMessage === 'string' ? 'user' : userMessage.role,
        content: typeof userMessage === 'string' 
          ? { text: userMessage } 
          : typeof userMessage.content === 'string'
            ? { text: userMessage.content }
            : userMessage.content,
        createdAt: new Date(),
      }],
    });

    // Process and return the AI response
    return createDataStreamResponse({
      execute: async (dataStream) => {
        try {
          const result = streamText({
            model: myProvider.languageModel('gpt-3.5-turbo'),
            system: await getSystemPrompt({}),
            messages,
            maxSteps: 5, // Allow multiple steps for multi-tool interactions
            experimental_transform: smoothStream({ chunking: 'word' }),
            experimental_generateMessageId: generateUUID,
            experimental_activeTools: [
              'queryData',
              'visualizeData',
              'getWeather',
              'createDocument',
              'updateDocument',
              'buildReport',
            ],
            tools: {
              ...dataTools,
              getWeather: getWeatherTool,
              createDocument: createDocument({ session, dataStream }),
              updateDocument: updateDocument({ session, dataStream }),
              buildReport: {
                parameters: buildReportTool.parameters,
                description: buildReportTool.description,
                execute: async (args, options) => {
                  try {
                    console.log('Building report with args:', args, 'toolCallId:', options?.toolCallId);
                    
                    // Send an initial progress update to show the "Thinking" indicator
                    dataStream.writeData({
                      type: 'tool-status',
                      content: {
                        toolCallId: options?.toolCallId || '',
                        status: 'running',
                        message: 'Generating comprehensive report...'
                      }
                    });
                    
                    // Generate the report and get the response
                    const report = await buildReport(args, { 
                      toolCallId: options?.toolCallId || '', 
                      dataStream, 
                      session, 
                      chatId: id 
                    });
                    
                    console.log('Report build successful:', report);
                    
                    // Update tool status to complete
                    dataStream.writeData({
                      type: 'tool-status',
                      content: {
                        toolCallId: options?.toolCallId || '',
                        status: 'complete',
                        message: 'Report generation complete'
                      }
                    });
                    
                    // Add UI to open the document
                    dataStream.writeData({
                      type: 'artifact',
                      content: {
                        documentId: report.documentId,
                        title: report.title,
                        kind: report.kind,
                        isVisible: true,
                        status: 'idle'
                      }
                    });
                    
                    // Return the document info as the tool result
                    return report;
                  } catch (error) {
                    console.error('Error building report:', error);
                    return `Error building report: ${error instanceof Error ? error.message : String(error)}`;
                  }
                }
              },
            },
            onFinish: async (result: any) => {
              try {
                // Basic type checking to prevent errors
                const responseMessages = [];
                
                // Try to access messages from the result, fallback to empty array
                if (result && typeof result === 'object') {
                  if (Array.isArray(result.messages)) {
                    responseMessages.push(...result.messages);
                  } else if (Array.isArray(result.steps)) {
                    // Extract messages from steps if that's the structure
                    const messagesFromSteps = result.steps
                      .filter((step: any) => step && step.type === 'assistant' && step.content)
                      .map((step: any) => step.content);
                    responseMessages.push(...messagesFromSteps);
                  }
                }
                
                console.log('Saving response messages:', {
                  count: responseMessages.length,
                  sample: responseMessages.length ? responseMessages[0] : null
                });
                
                if (responseMessages.length) {
                  await saveMessages({
                    messages: responseMessages.map((message: any) => ({
                      id: message.id || generateUUID(),
                      chatId: id,
                      role: message.role || 'assistant',
                      content: typeof message.content === 'string' 
                        ? { text: message.content } 
                        : message.content || { text: '' },
                      createdAt: new Date(),
                    })),
                  });
                  console.log('Messages saved successfully');
                } else {
                  console.warn('No messages to save from AI response');
                }
              } catch (error) {
                console.error('Failed to save response messages:', error);
              }
            },
          });

          result.consumeStream();
          result.mergeIntoDataStream(dataStream);
        } catch (error) {
          console.error('Stream execution error:', error);
          // Simplified error handling
          try {
            dataStream.writeData({ type: 'error', content: 'Failed to process request' });
          } catch (e) {
            console.error('Error while writing to dataStream:', e);
          }
        }
      },
      onError: (error) => {
        console.error('Stream error:', error);
        return 'An error occurred while processing your request. Please try again.';
      },
    });
  } catch (error) {
    console.error('Route error:', error);
    return new Response(JSON.stringify({ 
      error: 'An error occurred during chat processing',
      details: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// History endpoint - GET /chat
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chats = await getChatsByUserId({ userId: session.user.id });
    return Response.json(chats);
  } catch (error) {
    return new Response('Error', { status: 500 });
  }
}

// Delete chat endpoint - DELETE /chat?id=xxx
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}