# Debugging Anthropic API Key Issues

This guide helps verify that the Anthropic API key is correctly configured and accessible in your application.

## 1. Verify Doppler Secrets

First, check if the Anthropic API key exists in Doppler:

```bash
doppler secrets get ANTHROPIC_API_KEY
```

The key should start with `sk_ant_` and be properly set.

## 2. Verify AI SDK Requirements

The AI SDK (which includes `@ai-sdk/anthropic`) uses a specific environment variable naming convention. Let's ensure it's set properly:

```bash
# Set the environment variable expected by AI SDK
doppler secrets set ANTHROPIC_API_KEY sk_ant_your_key_here
```

## 3. Check Other Required Environment Variables

If you're still experiencing issues, make sure all required environment variables are set:

```bash
# The main environment variable used by the Anthropic client
doppler secrets set ANTHROPIC_API_KEY sk_ant_your_key_here

# Some packages might look for this alternative name
doppler secrets set CLAUDE_API_KEY sk_ant_your_key_here

# AI SDK might also look for this version
doppler secrets set AI_ANTHROPIC_API_KEY sk_ant_your_key_here
```

## 4. Restart Your Application

After setting these environment variables, restart your application:

```bash
npm run dev
```

## 5. Check Server Logs

Look for specific log messages indicating whether Anthropic is available:

```
API Environment check: {...}
Has valid Anthropic API key format: true/false
Using Anthropic provider: true/false
```

If you see "Has valid Anthropic API key format: false", it means the environment variable isn't being correctly loaded in your application.

## 6. Troubleshooting

If you're still experiencing issues:

1. Verify that the `ANTHROPIC_API_KEY` is correctly spelled in both Doppler and your code
2. Check if your current Anthropic key is active and valid
3. Try setting the environment variable directly in your terminal session:
   ```
   ANTHROPIC_API_KEY=sk_ant_your_key_here npm run dev
   ```
4. Review the AI SDK version requirements - make sure it's compatible with the current version of Anthropic 