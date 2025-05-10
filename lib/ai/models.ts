import { createOpenAI } from '@ai-sdk/openai';
import { createFireworks } from '@ai-sdk/fireworks';

// Create providers first
const openaiProvider = createOpenAI({ 
  apiKey: process.env.OPENAI_API_KEY! 
});

const fireworksProvider = createFireworks({ 
  apiKey: process.env.FIREWORKS_API_KEY! 
});

export const CHAT_MODELS = {
  'gpt-3.5': 'gpt-3.5-turbo',
  'gpt-4': 'gpt-4',
} as const;

export type ChatModelId = keyof typeof CHAT_MODELS;

export const DEFAULT_CHAT_MODEL: ChatModelId = 'gpt-3.5';

// Export providers for use in other files
export { openaiProvider, fireworksProvider };
