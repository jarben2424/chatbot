import { createOpenAI } from '@ai-sdk/openai';
import { createFireworks } from '@ai-sdk/fireworks';

// Create providers first
const openaiProvider = createOpenAI({ 
  apiKey: process.env.OPENAI_API_KEY! 
});

const fireworksProvider = createFireworks({ 
  apiKey: process.env.FIREWORKS_API_KEY! 
});

// Using the most advanced model available to us - Claude 3 Opus
const CLAUDE_MODEL_NAME = 'claude-3-opus-20240229';

export const CHAT_MODELS = {
  'gpt-3.5': 'gpt-3.5-turbo',
  'gpt-4': 'gpt-4',
  'opus-think': CLAUDE_MODEL_NAME, // Using Claude 3 Opus without alpha suffix
} as const;

export type ChatModelId = keyof typeof CHAT_MODELS;

export const DEFAULT_CHAT_MODEL: ChatModelId = 'gpt-3.5';

// Export providers for use in other files
export { openaiProvider, fireworksProvider };
