import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
  type ToolInvocation,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { businessDbQuery } from '@/lib/ai/tools/business-db-query';
import { dashboardEmailSubscription } from '@/lib/ai/tools/dashboard-email-subscription';
import { isProductionEnvironment } from '@/lib/constants';
import { NextResponse } from 'next/server';
import { myProvider } from '@/lib/ai/providers';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
    }: {
      id: string;
      messages: Array<Message>;
      selectedChatModel: string;
    } = await request.json();

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      await saveChat({ id, userId: session.user.id, title });
    } else {
      if (chat.userId !== session.user.id) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // Save the message to the database
    await saveMessages({
      messages: [{ 
        ...userMessage, 
        createdAt: new Date(), 
        chatId: id, 
        messageType: 'default'
      }],
    });

    console.log("Saved user message with chatId:", id, "and default messageType");

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel }),
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                  'businessDbQuery',
                  'dashboardEmailSubscription',
                ],
          experimental_transform: smoothStream({ 
            chunking: 'word',
            delayInMs: 0, // No delay between tool calls
          }),
          experimental_generateMessageId: generateUUID,
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
            businessDbQuery,
            dashboardEmailSubscription,
          },
          onFinish: async ({ response, reasoning }) => {
            if (session.user?.id) {
              try {
                const sanitizedResponseMessages = sanitizeResponseMessages({
                  messages: response.messages,
                  reasoning,
                });

                // Log the messages for debugging
                console.log("Processing assistant message with tools:", 
                  sanitizedResponseMessages.map(m => ({
                    id: m.id,
                    role: m.role,
                    toolInvocations: (m as any).toolInvocations?.map((t: ToolInvocation) => ({
                      toolName: t.toolName,
                      state: t.state
                    }))
                  }))
                );

                // Directly inspect the messages to identify any database queries
                for (const msg of sanitizedResponseMessages) {
                  if (msg.role === 'assistant') {
                    const toolInvocations = (msg as any).toolInvocations || [];
                    console.log(`Message ${msg.id} has ${toolInvocations.length} tool invocations`);
                    
                    for (const ti of toolInvocations) {
                      console.log(`Tool: ${ti.toolName}, State: ${ti.state}`);
                      if ((ti.toolName === 'businessDbQuery' || ti.toolName === 'textToSql') && ti.state === 'result') {
                        console.log(`Found database query tool invocation in message ${msg.id}`);
                      }
                    }
                  }
                }

                await saveMessages({
                  messages: sanitizedResponseMessages.map((message) => {
                    // Use the messageType that was already set during sanitization
                    // This avoids redoing the logic we already did in sanitizeResponseMessages
                    const messageType = (message as any).messageType || 'default';
                    
                    console.log(`Saving ${message.role} message with id: ${message.id}, type: ${messageType}`);
                    
                    // Make sure to return a new object with the messageType property explicitly set
                    const dbMessage = {
                      id: message.id,
                      chatId: id,
                      role: message.role,
                      content: message.content,
                      messageType: messageType,
                      createdAt: new Date(),
                    };
                    
                    console.log(`Message being saved:`, {
                      id: dbMessage.id,
                      role: dbMessage.role,
                      messageType: dbMessage.messageType
                    });
                    
                    return dbMessage;
                  }),
                });
              } catch (error) {
                console.error('Failed to save chat', error);
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: () => {
        return 'Oops, an error occured!';
      },
    });
  } catch (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
}

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
