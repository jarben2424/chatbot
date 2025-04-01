# Claude 3 Opus Integration Guide

We've integrated Anthropic's Claude 3 Opus model - their most advanced AI - with the application to provide superior analytical capabilities combined with web search. This document explains the OpusThink mode and helps troubleshoot common issues.

## Implementation Details

- **Model Used**: `claude-3-opus-20240229` (Anthropic's most powerful model)
- **Toggle Feature**: "OpusThink" mode button in the chat interface enables/disables Claude
- **Features**:
  - MBA-level business analysis with framework application
  - Web search integration for external information (Grok DeepSearch-like)
  - Direct database queries for customer data
  - Extended reasoning for comprehensive analysis (Grok Think-like)
  - Strategic recommendations with clear rationales
  - Business framework application (SWOT, Porter's Five Forces, etc.)

## Environment Setup

To make the Claude 3 Opus integration work, you need to set up these environment variables in Doppler:

```bash
# The main API key for Anthropic 
doppler secrets set ANTHROPIC_API_KEY sk_ant_your_key_here

# Alternative names for redundancy (safety measure)
doppler secrets set CLAUDE_API_KEY sk_ant_your_key_here
doppler secrets set AI_ANTHROPIC_API_KEY sk_ant_your_key_here

# Enable web search
doppler secrets set ENABLE_WEB_SEARCH true
doppler secrets set SERPAPI_API_KEY your_serpapi_key_here
```

## Required Packages

Make sure these packages are installed:

```bash
npm install @ai-sdk/anthropic@latest @anthropic-ai/sdk axios --force
```

## Common Issues and Solutions

### "Opus Think unavailable, falling back to GPT-4"

This means the system couldn't access the Anthropic API. Check:

1. **Environment Variables**: Ensure `ANTHROPIC_API_KEY` is set correctly in Doppler
   ```bash
   doppler secrets get ANTHROPIC_API_KEY
   ```
   The key should start with `sk_ant_` and be a valid API key.

2. **Model Availability**: We're using `claude-3-opus-20240229`. If this model becomes deprecated, update:
   - `lib/ai/models.ts`: Change the model name in `CHAT_MODELS`
   - `lib/ai/providers.ts`: Update `CLAUDE_MODEL_NAME`
   - `app/(chat)/chat/route.ts`: Update `CLAUDE_MODEL_NAME`

3. **API Access**: Verify your Anthropic key has access to the Claude models using our test script:
   ```bash
   doppler run -- node scripts/test-anthropic.js
   ```

### Type Conflicts

If you see type errors related to the Anthropic integration, we've implemented a workaround using the standard OpenAI provider in the UI but the Anthropic API behind the scenes.

## Testing the Integration

To verify everything is working:

1. Check API access:
   ```bash
   doppler run -- node scripts/test-anthropic.js
   ```

2. Look for these log messages in the console:
   ```
   API Environment check: {...}
   Has valid Anthropic API key format: true
   Using Anthropic provider: true
   Anthropic model: claude-3-opus-20240229
   ```

3. In the application, toggle OpusThink mode and send a test message. You should see:
   - The toggle button turns purple when active
   - Responses are more comprehensive with MBA-style analysis
   - Web searches are incorporated when relevant
   - Results include business framework application

## When to Use OpusThink vs. GPT

- **Claude 3 Opus (OpusThink mode)**: Best for complex business analysis, strategy recommendations, market research, and when you need deep reasoning with external context
- **GPT**: Better for quick answers, coding help, and general assistance

The application will automatically fall back to GPT-4 if there's any issue with the Anthropic API, ensuring continuity of service. 