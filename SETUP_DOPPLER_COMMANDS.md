# Doppler Setup Commands for Sonnet 3.7 Think Mode

Run the following commands to set up the necessary environment variables in Doppler for the Sonnet 3.7 Think mode feature. Replace the placeholder values with your actual API keys.

```bash
# Enable web search functionality
doppler secrets set ENABLE_WEB_SEARCH true

# Add your Anthropic API key for Claude 3.7 Sonnet
# Get your API key from: https://console.anthropic.com/
doppler secrets set ANTHROPIC_API_KEY sk_ant_...your_key_here...

# Add your SerpAPI key for web search capabilities
# Get your API key from: https://serpapi.com/
doppler secrets set SERPAPI_API_KEY your_serpapi_key_here
```

## Verifying Your Setup

After adding the secrets, you can verify they're set correctly with:

```bash
doppler secrets get ENABLE_WEB_SEARCH
doppler secrets get ANTHROPIC_API_KEY
doppler secrets get SERPAPI_API_KEY
```

## Installing Required Dependencies

Make sure to install the required NPM packages:

```bash
npm install @ai-sdk/anthropic@latest axios@^1.6.2
```

## Troubleshooting

If you encounter the error `TypeError: Cannot read properties of undefined (reading 'typeName')`, it's likely due to an issue with the SerpAPI response format or authentication. Try running the application with only simulated results first:

```bash
# Test with simulated search results only
doppler secrets set ENABLE_WEB_SEARCH false
```

Once you confirm everything else is working, you can re-enable web search:

```bash
doppler secrets set ENABLE_WEB_SEARCH true
``` 