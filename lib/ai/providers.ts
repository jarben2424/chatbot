import { customProvider } from 'ai';
import { openai } from '@ai-sdk/openai';

export const myProvider = customProvider({
  languageModels: {
    'correct-model-id': openai('correct-model-id'),
    'gpt-3.5-turbo': openai('gpt-3.5-turbo'),
    'gpt-4': openai('gpt-4'),
  }
});
