const AIProviderFactory = require('../services/ai-provider-factory');
const MockProvider = require('../services/providers/mock-provider');
const AIProvider = require('../services/ai-provider-interface');

describe('AIProviderFactory', () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
  });

  it('creates a MockProvider when AI_PROVIDER=mock', () => {
    process.env.AI_PROVIDER = 'mock';
    const provider = AIProviderFactory.create();
    expect(provider).toBeInstanceOf(MockProvider);
    expect(provider).toBeInstanceOf(AIProvider);
  });

  it('throws for unsupported provider', () => {
    process.env.AI_PROVIDER = 'unsupported';
    expect(() => AIProviderFactory.create()).toThrow(/unsupported/i);
  });

  it('throws for openai without API key', () => {
    process.env.AI_PROVIDER = 'openai';
    expect(() => AIProviderFactory.create()).toThrow();
  });

  it('returns available providers list', () => {
    const providers = AIProviderFactory.getAvailableProviders();
    expect(providers).toContain('openai');
    expect(providers).toContain('gemini');
    expect(providers).toContain('openrouter');
    expect(providers).toContain('mock');
    expect(providers.length).toBe(4);
  });

  it('defaults to openai when AI_PROVIDER is not set', () => {
    delete process.env.AI_PROVIDER;
    // openai without API key should throw
    expect(() => AIProviderFactory.create()).toThrow();
  });
});
