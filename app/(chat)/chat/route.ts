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
import { checkRateLimit } from '@/lib/rate-limit';

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
      const title = await generateTitleFromUserMessage({ message: userMessage });
      await saveChat({ 
        id, 
        userId: session.user.id, 
        title,
        visibility: 'private'
      });
    }

    // Save the user message
    await saveMessages({
      messages: [{ 
        id: generateUUID(),
        chatId: id,
        role: userMessage.role,
        content: typeof userMessage.content === 'string' 
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
            ],
            tools: {
              ...dataTools,
              getWeather,
              createDocument: createDocument({ session, dataStream }),
              updateDocument: updateDocument({ session, dataStream }),
            },
            onFinish: async (result) => {
              try {
                // Access messages correctly from the result object
                // This depends on the structure of the result object from the AI SDK
                const responseMessages = result.messages || [];
                console.log('Saving response messages:', {
                  count: responseMessages.length,
                  sample: responseMessages[0]
                });
                
                if (responseMessages.length) {
                  await saveMessages({
                    messages: responseMessages.map((message) => ({
                      id: message.id || generateUUID(),
                      chatId: id,
                      role: message.role,
                      content: typeof message.content === 'string' 
                        ? { text: message.content } 
                        : message.content,
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
          dataStream.write({ type: 'error', error: 'Failed to process request' });
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