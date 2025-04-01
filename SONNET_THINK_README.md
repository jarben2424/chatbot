# Sonnet 3.7 Think Mode

This feature enhances your chatbot with advanced analytical capabilities using Anthropic's Claude 3.7 Sonnet model in "Think" mode, which enables deeper reasoning, web search integration, and MBA-level business analysis.

## Setup Instructions

### 1. Install Required Dependencies

```bash
# Install the Anthropic AI SDK
npm install @ai-sdk/anthropic@latest

# Install axios (used for web search functionality)
npm install axios@^1.6.2
```

### 2. Set Environment Variables

Add the following variables to your `.env` file or Doppler configuration:

```
# Anthropic API key
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Enable web search functionality (set to true to enable)
ENABLE_WEB_SEARCH=true

# SerpAPI for web search (get your API key at https://serpapi.com)
SERPAPI_API_KEY=your_serpapi_key_here
```

To add these secrets to Doppler, run:

```bash
doppler secrets set ANTHROPIC_API_KEY=your_actual_anthropic_api_key
doppler secrets set ENABLE_WEB_SEARCH=true
doppler secrets set SERPAPI_API_KEY=your_actual_serpapi_key
```

### 3. Web Search Details

We've integrated SerpAPI for real Google search results. The implementation:

- Automatically falls back to simulated results if the API key is missing
- Handles error cases gracefully with simulated results as backup
- Limits to 5 search results per query to control costs

If you need to modify the search implementation, edit `lib/ai/tools/web-search.ts`.

## Features

### Enhanced Analysis Capabilities

Sonnet 3.7 Think mode provides:

- **MBA-Level Business Analysis**: Applies business frameworks, integrates multiple data sources, and provides strategic recommendations
- **Web Search Integration**: Accesses external information to complement internal data
- **Direct Database Queries**: Autonomously queries your database when needed
- **Extended Processing**: Uses more reasoning steps to produce comprehensive analysis

### User Interface

- A "Think" toggle button in the chat interface enables/disables Sonnet Think mode
- The toggle persists across sessions via local storage
- Visual feedback indicates when Think mode is active

## Usage Examples

Sonnet Think mode is particularly valuable for:

1. **Complex Business Analysis**:
   ```
   "Analyze our customer retention trends over the last year and compare to industry benchmarks"
   ```

2. **Strategy Recommendations**:
   ```
   "What pricing strategy would you recommend for our new product line based on our current market position?"
   ```

3. **Data-Enriched Insights**:
   ```
   "How does our customer acquisition cost compare to industry standards, and what improvements can we make?"
   ```

4. **Market Research Integration**:
   ```
   "What emerging trends should we consider when planning our Q3 marketing campaigns?"
   ```

## Technical Notes

- Sonnet Think mode uses more tokens and may take longer to respond due to its deeper analysis
- SerpAPI has usage limits based on your subscription plan
- The model automatically decides when to use web search based on the query context
- Setting `ENABLE_WEB_SEARCH=false` will use simulated search results for development 