const OpenAIProvider = require('./providers/openai-provider');
const GeminiProvider = require('./providers/gemini-provider');
const OpenRouterProvider = require('./providers/openrouter-provider');
const MockProvider = require('./providers/mock-provider');

class AIProviderFactory {
  static create() {
    const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();

    console.log(`[AI Factory] Creating provider: ${provider}`);

    switch (provider) {
      case 'openai':
        try {
          return new OpenAIProvider();
        } catch (error) {
          console.error(`[AI Factory] Failed to initialize OpenAI provider:`, error.message);
          throw error;
        }

      case 'gemini':
        try {
          return new GeminiProvider();
        } catch (error) {
          console.error(`[AI Factory] Failed to initialize Gemini provider:`, error.message);
          throw error;
        }

      case 'openrouter':
        try {
          return new OpenRouterProvider();
        } catch (error) {
          console.error(`[AI Factory] Failed to initialize OpenRouter provider:`, error.message);
          throw error;
        }

      case 'mock':
        console.log('[AI Factory] Using mock provider for testing');
        return new MockProvider();

      default:
        throw new Error(
          `Unsupported AI provider: ${provider}. ` +
          `Supported providers: openai, gemini, openrouter, mock`
        );
    }
  }

  static getAvailableProviders() {
    return ['openai', 'gemini', 'openrouter', 'mock'];
  }
}

module.exports = AIProviderFactory;
