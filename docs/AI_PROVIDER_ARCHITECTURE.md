# AI Provider Architecture

## Overview

The CSV Importer uses a **provider-agnostic architecture** that allows you to switch between different AI providers by changing a single environment variable. This design follows **SOLID principles** (specifically Dependency Inversion) and makes the system extensible, testable, and maintainable.

## Architecture Diagram

```
Frontend (Next.js)
       │
       ▼
Express.js Backend
       │
       ▼
AI Service Interface (llm-service.js)
       │
       ▼
AIProviderFactory
       │
    ┌──┴──┬──────┬──────┐
    ▼     ▼      ▼      ▼
 OpenAI Gemini OpenRouter Mock
    │     │      │      │
    └──┬──┴──────┴──────┘
       │
       ▼
Standardized CRM Response
```

## Supported Providers

### 1. OpenAI (Default)
- **Model**: `gpt-4o-mini` (or customize with `OPENAI_MODEL`)
- **API**: Official OpenAI Chat Completions API
- **Configuration**:
  ```env
  AI_PROVIDER=openai
  OPENAI_API_KEY=sk_...
  OPENAI_MODEL=gpt-4o-mini
  ```

### 2. Google Gemini
- **Model**: `gemini-1.5-flash` (or customize with `GEMINI_MODEL`)
- **API**: Google's Generative AI API
- **Configuration**:
  ```env
  AI_PROVIDER=gemini
  GEMINI_API_KEY=your_key_here
  GEMINI_MODEL=gemini-1.5-flash
  ```

### 3. OpenRouter
- **Model**: `openai/gpt-4o-mini` (or any OpenRouter-supported model)
- **API**: OpenRouter unified API gateway
- **Configuration**:
  ```env
  AI_PROVIDER=openrouter
  OPENROUTER_API_KEY=sk_...
  OPENROUTER_MODEL=openai/gpt-4o-mini
  ```
- **Benefits**:
  - Access to 200+ models from different providers
  - Automatic failover and load balancing
  - Unified pricing and billing
  - Try different models: `anthropic/claude-3-sonnet`, `mistral/large`, `cohere/command-r`, etc.

### 4. Mock Provider (Testing)
- **Model**: `mock`
- **API**: Simulated data extraction (no API calls)
- **Configuration**:
  ```env
  AI_PROVIDER=mock
  ```
- **Benefits**:
  - Perfect for development and testing
  - No API costs
  - Deterministic results
  - Fast processing

## How to Switch Providers

### Quick Switch
Just change `AI_PROVIDER` in `.env.local`:

```bash
# Use OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=sk_...

# OR use Gemini
AI_PROVIDER=gemini
GEMINI_API_KEY=...

# OR use OpenRouter
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk_...

# OR use Mock (for testing)
AI_PROVIDER=mock
```

Then restart the backend server:
```bash
pnpm run server
# or
pnpm run dev:all
```

## Architecture Details

### AIProvider Interface
All providers implement the `AIProvider` interface:

```javascript
class AIProvider {
  async extractCRMData(records) {
    // Main method - processes CSV rows and returns CRM records
  }

  validateExtractedRow(row) {
    // Validates extracted data against CRM schema
  }

  getSystemPrompt() {
    // Returns the system prompt for the LLM
  }
}
```

### AIProviderFactory
The factory creates the appropriate provider based on environment configuration:

```javascript
const provider = AIProviderFactory.create();
// Returns: OpenAIProvider | GeminiProvider | OpenRouterProvider | MockProvider
```

### Service Integration
The main service (`llm-service.js`) uses the factory:

```javascript
const { extractAndMapCSVRows } = require('./services/llm-service');

const { results, errors } = await extractAndMapCSVRows(csvRows);
```

## Benefits of This Architecture

✅ **Loosely Coupled**: Business logic is independent of AI vendor  
✅ **Easy to Switch**: Change providers without modifying application code  
✅ **Simple to Extend**: Add new providers by implementing the interface  
✅ **Better Testing**: Use MockProvider for deterministic unit tests  
✅ **Production Ready**: Implement automatic failover if needed  
✅ **Cost Optimization**: Switch to cheaper models or providers  
✅ **Vendor Independence**: Not locked into a single provider  

## Adding a New Provider

To add a new AI provider (e.g., Anthropic Claude):

1. Create a new file: `services/providers/anthropic-provider.js`
2. Extend the `AIProvider` interface
3. Implement `extractCRMData()` method
4. Update `AIProviderFactory` to handle the new provider
5. Add environment variables to `.env.local`

Example:

```javascript
// services/providers/anthropic-provider.js
const Anthropic = require('@anthropic-ai/sdk').default;
const AIProvider = require('../ai-provider-interface');

class AnthropicProvider extends AIProvider {
  constructor() {
    super();
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async extractCRMData(records) {
    // Implementation using Claude API
  }
}

module.exports = AnthropicProvider;
```

Then update the factory:

```javascript
case 'anthropic':
  return new AnthropicProvider();
```

## Performance Comparison

| Provider | Cost | Speed | Quality | Availability |
|----------|------|-------|---------|--------------|
| OpenAI | $$ | Fast | Excellent | Excellent |
| Gemini | $ | Very Fast | Excellent | Excellent |
| OpenRouter | Variable | Fast | Good-Excellent | Excellent |
| Mock | Free | Instant | Deterministic | Always |

## Recommendations

- **Development**: Use `mock` provider for cost-free testing
- **Production**: Use `openai` (default) or `gemini` for best quality
- **Cost Optimization**: Use OpenRouter with `mistral/large` or `cohere/command-r`
- **High Volume**: Use Gemini (typically faster and cheaper per token)
- **Failover**: Implement multi-provider fallback using factory

## Environment Variables Reference

```env
# Provider Selection (required)
AI_PROVIDER=openai

# OpenAI
OPENAI_API_KEY=sk_...
OPENAI_MODEL=gpt-4o-mini

# Gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-flash

# OpenRouter
OPENROUTER_API_KEY=sk_...
OPENROUTER_MODEL=openai/gpt-4o-mini
```

## Troubleshooting

### Provider initialization fails
- Verify the API key is set in `.env.local`
- Restart the backend server after changing `.env.local`
- Check that `AI_PROVIDER` value matches a supported provider

### Provider not processing records
- Check server logs for error messages
- Use `AI_PROVIDER=mock` to verify the flow works
- Verify API key has required permissions

### Slow processing
- Try `gemini` provider (generally faster)
- Use smaller batches by modifying batch size in provider files
- Consider using OpenRouter with a faster model
