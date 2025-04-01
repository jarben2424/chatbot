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
import { myProvider, createAnthropicProvider } from '@/lib/ai/providers';
import { dataTools } from '@/lib/ai/tools/data-tools';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { buildReport, buildReportTool } from '@/lib/ai/tools/report-builder';
import { checkRateLimit } from '@/lib/rate-limit';
import { webSearchTool, webSearch } from '@/lib/ai/tools/web-search';
import { directQueryTool } from '@/lib/ai/tools/direct-query';
import { qsrQueryTool } from '@/lib/ai/tools/qsr-query';

// Add this type definition near the top of the file
type CustomActiveTools = Array<string>;

// Update the Anthropic model name to use Claude 3 Opus
const CLAUDE_MODEL_NAME = 'claude-3-opus-20240229';

// Helper function for Sonnet 3.7 to directly query data
const directQueryForSonnet = async (query: string) => {
  try {
    // Implementation for direct data querying that Sonnet can use
    // This is a placeholder and would need to be implemented based on your data sources
    console.log('Direct query for Sonnet 3.7:', query);
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error in directQueryForSonnet:', error);
    return { success: false, error: String(error) };
  }
};

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

// Add a safe tools wrapper function that prevents errors from crashing the stream
const createSafeToolWrapper = (tool: any) => {
  const originalExecute = tool.execute;
  
  // Create a wrapped execute function with error handling
  const safeExecute = async (...args: any[]) => {
    try {
      const result = await originalExecute(...args);
      return result;
    } catch (error) {
      console.error(`Error in tool execution:`, error);
      // Return a safe error response that won't crash the stream
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        fallback: true
      };
    }
  };
  
  // Return a new tool with the safe execute function
  return {
    ...tool,
    execute: safeExecute
  };
};

// Add a function to check Anthropic availability
const checkAnthropicAvailability = async () => {
  try {
    // Create the provider on demand
    const anthropicProvider = createAnthropicProvider();
    
    // Log the debug info
    console.log('Checking Anthropic availability');
    console.log('Anthropic provider exists:', !!anthropicProvider);
    
    if (!anthropicProvider) {
      return {
        available: false,
        reason: 'No Anthropic provider available - missing or invalid API key'
      };
    }
    
    // Return success
    return {
      available: true,
      reason: 'Anthropic provider is available'
    };
  } catch (error) {
    console.error('Error checking Anthropic availability:', error);
    return {
      available: false,
      reason: `Anthropic error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// Chat endpoint - POST /chat
export async function POST(request: Request) {
  try {
    const { id, messages, selectedChatModel } = await request.json();
    const session = await auth();

    // Update check for OpusThink mode
    const isOpusThinkMode = selectedChatModel === 'opus-think';
    
    // Check if Anthropic is available when in Opus mode
    let anthropicStatus = { available: false, reason: 'Not checked' };
    if (isOpusThinkMode) {
      anthropicStatus = await checkAnthropicAvailability();
    }
    
    console.log('Chat route:', { 
      selectedModel: selectedChatModel, 
      isOpusThinkMode, 
      anthropicKeyExists: !!process.env.ANTHROPIC_API_KEY,
      webSearchEnabled: process.env.ENABLE_WEB_SEARCH === 'true',
      anthropicStatus
    });

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
          // Send an initial thinking indicator if using OpusThink mode
          if (isOpusThinkMode) {
            dataStream.writeData({
              type: 'thinking-update',
              content: {
                status: 'started',
                step: 'initialization',
                message: 'OpusThink mode activated. Analyzing request...'
              }
            });
            
            // Set up a timer to send periodic updates about thinking progress
            let stepCount = 0;
            const thinkingSteps = [
              'Analyzing query requirements',
              'Determining information needs',
              'Checking for required data sources',
              'Planning analytical approach',
              'Preparing response framework',
              'Gathering relevant information',
              'Applying business frameworks',
              'Synthesizing insights',
              'Formulating recommendations',
              'Finalizing response'
            ];
            
            const thinkingInterval = setInterval(() => {
              if (stepCount < thinkingSteps.length) {
                try {
                  dataStream.writeData({
                    type: 'thinking-update',
                    content: {
                      status: 'in_progress',
                      step: `step_${stepCount + 1}`,
                      message: thinkingSteps[stepCount]
                    }
                  });
                  stepCount++;
                } catch (e) {
                  // Ignore errors if stream is already closed
                  clearInterval(thinkingInterval);
                }
              } else {
                clearInterval(thinkingInterval);
              }
            }, 1000); // Update every second
            
            // Make sure to clear the interval when done or on error
            setTimeout(() => clearInterval(thinkingInterval), 12000); // Safety clear after 12s
          }
          
          // Define the tools including conditionally added Sonnet tools
          const baseTools = {
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
                  
                  // Add UI to open the document without exposing document ID to user
                  dataStream.writeData({
                    type: 'artifact',
                    content: {
                      documentId: report.documentId,
                      title: report.title,
                      kind: report.kind || 'text',
                      isVisible: true,
                      status: 'idle'
                    }
                  });
                  
                  // Modify the assistant's message to avoid including document ID
                  dataStream.writeData({
                    type: 'text',
                    content: `I have generated a comprehensive report on ${args.topic || 'your requested topic'}. You can access the report below.`
                  });
                  
                  // Return the document info as the tool result
                  return report;
                } catch (error) {
                  console.error('Error building report:', error);
                  return `Error building report: ${error instanceof Error ? error.message : String(error)}`;
                }
              }
            },
          };
          
          // Add Sonnet-specific tools conditionally
          let allTools = baseTools;
          let activeTools: CustomActiveTools = [
            'queryData',
            'visualizeData',
            'getWeather',
            'createDocument',
            'updateDocument',
            'buildReport',
          ];
          
          if (isOpusThinkMode) {
            allTools = {
              ...baseTools,
              directQuery: directQueryTool,
              webSearch: createSafeToolWrapper(webSearchTool),
              qsrQuery: qsrQueryTool
            };
            
            activeTools.push('directQuery');
            activeTools.push('webSearch');
            activeTools.push('qsrQuery');
          }

          const result = streamText({
            model: myProvider.languageModel(isOpusThinkMode ? CLAUDE_MODEL_NAME : 'gpt-3.5-turbo'),
            system: await getSystemPrompt({ isOpusThinkMode }),
            messages,
            maxSteps: isOpusThinkMode ? 12 : 5, // More steps for Opus Think mode
            experimental_transform: smoothStream({ chunking: 'word' }),
            experimental_generateMessageId: generateUUID,
            experimental_activeTools: activeTools,
            tools: allTools,
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