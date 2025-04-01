import { customProvider } from 'ai';
import { openai } from '@ai-sdk/openai';
// Now that Anthropic is installed, we can import it
import { anthropic } from '@ai-sdk/anthropic';

// Add comprehensive debug logging for environment variables
const debugEnv = {
  ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_API_KEY_LENGTH: process.env.ANTHROPIC_API_KEY?.length || 0,
  ANTHROPIC_API_KEY_PREFIX: process.env.ANTHROPIC_API_KEY?.substring(0, 7) || 'missing',
  ENABLE_WEB_SEARCH: process.env.ENABLE_WEB_SEARCH,
  NODE_ENV: process.env.NODE_ENV,
};

console.log('API Environment check:', JSON.stringify(debugEnv, null, 2));

// Fix the detection mechanism - we need to check for the correct prefix without the colon
const hasValidAnthropicKey = process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant') || false;
console.log('Has valid Anthropic API key format:', hasValidAnthropicKey);

// Update model name to match the models.ts file
export const CLAUDE_MODEL_NAME = 'claude-3-opus-20240229';
export const CLAUDE_SONNET_MODEL_NAME = 'claude-3-sonnet-20240229';
export const CLAUDE_OPUS_3_5_MODEL_NAME = 'claude-3-5-sonnet-20240620';

// Due to type conflicts, we can't mix providers, so we'll use only OpenAI in the provider
// and handle Anthropic specially in the route handler
export const myProvider = customProvider({
  languageModels: {
    'correct-model-id': openai('correct-model-id'),
    'gpt-3.5-turbo': openai('gpt-3.5-turbo'),
    'gpt-4': openai('gpt-4'),
    'artifact-model': openai('gpt-3.5-turbo'),
    // Use GPT-4 as a fallback for all cases
    [CLAUDE_MODEL_NAME]: openai('gpt-4'),
    [CLAUDE_SONNET_MODEL_NAME]: openai('gpt-4'),
    [CLAUDE_OPUS_3_5_MODEL_NAME]: openai('gpt-4'),
  }
});

// Create separate Anthropic provider for direct use
export const createAnthropicProvider = (modelName = CLAUDE_MODEL_NAME) => {
  if (hasValidAnthropicKey) {
    try {
      return anthropic(modelName);
    } catch (error) {
      console.error('Error creating Anthropic provider:', error);
      return null;
    }
  }
  return null;
};

// For debugging purposes
console.log('Using Anthropic provider:', hasValidAnthropicKey);
console.log('Anthropic model:', CLAUDE_MODEL_NAME);
