#!/usr/bin/env node

// Simple script to test if the Anthropic API is accessible
const Anthropic = require('@anthropic-ai/sdk');
const dotenv = require('dotenv');

// Load environment variables from .env file or other dotenv configurations
dotenv.config();

// Print all keys without their values
console.log('Environment variables that might be used for Anthropic:');
[
  'ANTHROPIC_API_KEY',
  'CLAUDE_API_KEY', 
  'AI_ANTHROPIC_API_KEY'
].forEach(key => {
  const value = process.env[key];
  if (value) {
    const maskedValue = value.substring(0, 7) + '...' + value.substring(value.length - 4);
    console.log(`- ${key}: ${maskedValue} (${value.length} chars)`);
  } else {
    console.log(`- ${key}: Not found`);
  }
});

// Set up the Anthropic client
console.log('\nTesting Anthropic API connection...');
const apiKey = process.env.ANTHROPIC_API_KEY || 
               process.env.CLAUDE_API_KEY || 
               process.env.AI_ANTHROPIC_API_KEY;

if (!apiKey) {
  console.error('Error: No Anthropic API key found in environment variables');
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: apiKey,
});

// Update the function to try Opus models first
async function testConnection() {
  // Different Claude models to try, ordered by capability (most advanced first)
  const models = [
    'claude-3-5-opus-20240620',
    'claude-3-opus-20240229',
    'claude-3-5-sonnet-20240620',
    'claude-3-sonnet-20240229-v1',  
    'claude-3-haiku-20240307',
    'claude-instant-1.2'
  ];
  
  let lastError = null;
  
  for (const model of models) {
    try {
      console.log(`Trying model: ${model}...`);
      
      const response = await anthropic.messages.create({
        model: model,
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Hello, are you working? Please respond with a short confirmation.',
          },
        ],
      });

      console.log('\nSuccess! Response received:');
      console.log(`Content: ${response.content[0].text}`);
      console.log(`\nAPI connection is working correctly with model: ${model}\n`);
      return; // Exit function on success
    } catch (error) {
      console.log(`Error with model ${model}: ${error.message}`);
      lastError = error;
      // Continue to the next model
    }
  }
  
  // If we get here, all models failed
  console.error('\nFailed to connect with any available Claude models');
  console.error('Last error:', lastError);
  console.log('\nPlease check available models at https://docs.anthropic.com/claude/docs/models-overview');
  process.exit(1);
}

// Run the test
testConnection(); 