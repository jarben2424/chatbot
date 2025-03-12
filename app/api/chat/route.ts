import { OpenAIStream, StreamingTextResponse } from 'ai';
import { auth } from '@/auth';
import { createAIStreamWriter } from '@/lib/ai/stream-writer';
import { createDocument } from '@/lib/ai/tools/create-document';
import { queryDataTool } from '@/lib/ai/tools/query-data';
import { visualizeDataTool } from '@/lib/ai/tools/visualize-data';
import { openai } from '@/lib/ai/providers';
import { checkRateLimit } from '@/lib/rate-limit';
import { saveChat, saveMessages, getChatById } from '@/lib/db/chat';
import { generateUUID } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Check rate limiting
    const rate = await checkRateLimit(session.user.id);
    if (!rate.allowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        details: `You have ${rate.remaining} requests remaining today.`
      }), { 
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { messages, id: chatId } = await req.json();
    
    // Create a stream writer for handling document content
    const dataStream = createAIStreamWriter();
    
    // Create or get chat
    const chatIdentifier = chatId || generateUUID();
    
    if (!chatId) {
      await saveChat({
        id: chatIdentifier,
        title: messages[0]?.content.substring(0, 100) || 'New Chat',
        userId: session.user.id,
        createdAt: new Date()
      });
    }
    
    // Save the user message
    if (messages[messages.length - 1]?.role === 'user') {
      await saveMessages({
        messages: [{
          id: generateUUID(),
          chatId: chatIdentifier,
          role: 'user',
          content: messages[messages.length - 1].content,
          createdAt: new Date()
        }]
      });
    }
    
    // Create a response stream with all our tools
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages,
      stream: true,
      tools: [
        createDocument({ session, dataStream }),
        queryDataTool,
        visualizeDataTool
      ]
    });

    // Create a streaming response
    const stream = OpenAIStream(response, {
      onCompletion: async (completion) => {
        // Save the assistant message
        await saveMessages({
          messages: [{
            id: generateUUID(),
            chatId: chatIdentifier,
            role: 'assistant',
            content: completion,
            createdAt: new Date()
          }]
        });
      }
    });

    // Return the streaming response
    return new StreamingTextResponse(stream, {
      headers: { 'X-Chat-Id': chatIdentifier }
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(JSON.stringify({ error: 'An error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 