import { StreamingTextResponse, OpenAIStream } from 'ai';
import { OpenAI } from 'openai';
import { auth } from '@/auth';
import { nanoid } from '@/lib/utils';
import { env } from '@/lib/env';
import { queryDataTool } from '@/lib/ai/tools/query-data';
import { visualizeDataTool } from '@/lib/ai/tools/visualize-data';
import { saveChatMessage } from '@/lib/db/actions';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  const json = await req.json();
  const { messages, id } = json;
  const userId = (await auth())?.user.id;

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Convert our custom tools to OpenAI format
  const tools = [
    {
      type: 'function',
      function: {
        name: visualizeDataTool.name,
        description: visualizeDataTool.description,
        parameters: visualizeDataTool.schema
      }
    },
    {
      type: 'function',
      function: {
        name: queryDataTool.name,
        description: queryDataTool.description,
        parameters: queryDataTool.schema
      }
    }
  ];

  // Request the OpenAI API for the response
  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL || 'gpt-4o',
    stream: true,
    messages,
    tools
  });

  // Create an executor map for our tools
  const toolExecutors = {
    [visualizeDataTool.name]: visualizeDataTool.runToolAction,
    [queryDataTool.name]: queryDataTool.runToolAction
  };

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response, {
    async experimental_onToolCall({ name, args }) {
      // Execute the appropriate tool based on the name
      if (name in toolExecutors) {
        try {
          return await toolExecutors[name](args);
        } catch (error) {
          console.error(`Error executing tool ${name}:`, error);
          return { error: `Failed to execute ${name}: ${error.message}` };
        }
      }
      
      return { error: `Unknown tool: ${name}` };
    },
    async onCompletion(completion) {
      // Save the chat to the database
      const title = json.messages[0].content.substring(0, 100);
      const chatId = id ?? nanoid();
      
      try {
        await saveChatMessage({
          chatId,
          content: completion,
          role: 'assistant',
          userId
        });
      } catch (error) {
        console.error('Failed to save chat message:', error);
      }
    }
  });

  // Respond with the stream
  return new StreamingTextResponse(stream, {
    headers: id ? {} : { 'x-chat-id': nanoid() }
  });
} 