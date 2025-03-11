import { OpenAI } from 'openai';
import { isTestEnvironment } from '../constants';

/**
 * Unified AI client for various models
 * Provides a consistent interface for model interactions
 */
interface AIClient {
  chat: (options: {
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  }) => Promise<{ content: string }>;
}

// Singleton instance of AIClient
let aiClient: AIClient | null = null;

/**
 * Get the AI client instance
 * Returns a singleton instance of the AIClient
 */
export function getAIClient(): AIClient {
  if (aiClient) {
    return aiClient;
  }

  // If using test environment, create a mock client
  if (isTestEnvironment) {
    aiClient = {
      chat: async ({ messages }) => {
        // Simple mock implementation for testing
        const lastMessage = messages[messages.length - 1].content;
        if (lastMessage.includes('SQL') || lastMessage.toLowerCase().includes('query')) {
          return {
            content: 'SELECT * FROM mock_table LIMIT 10;',
          };
        }
        return {
          content: 'This is a test response from the mock AI client.',
        };
      },
    };
    return aiClient;
  }

  // Create OpenAI client using SDK
  const openAIClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  aiClient = {
    chat: async ({ messages, temperature = 0.7, maxTokens, stream = false }) => {
      try {
        if (stream) {
          // Handle streaming case - not implemented in this simplified version
          throw new Error('Streaming not implemented in this client');
        }

        // Use OpenAI API directly
        const response = await openAIClient.chat.completions.create({
          model: 'gpt-4o-mini', // Use the model specified in providers.ts
          messages: messages as any,
          temperature,
          max_tokens: maxTokens,
        });

        return {
          content: response.choices[0]?.message?.content || '',
        };
      } catch (error) {
        console.error('Error in AI client chat:', error);
        throw error;
      }
    },
  };

  return aiClient;
}
