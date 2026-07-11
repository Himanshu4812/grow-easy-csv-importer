const AIProviderFactory = require('./ai-provider-factory');
const MockProvider = require('./providers/mock-provider');

const CRM_STATUSES = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'];
const DATA_SOURCES = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'];

let aiProvider = null;
let useFallback = false;

function initializeProvider() {
  if (!aiProvider && !useFallback) {
    try {
      aiProvider = AIProviderFactory.create();
      console.log('[LLM Service] AI provider initialized successfully');
    } catch (error) {
      console.error('[LLM Service] Failed to initialize AI provider:', error.message);
      console.warn('[LLM Service] Will use fallback mock provider');
      useFallback = true;
    }
  }
  return aiProvider;
}

async function extractAndMapCSVRows(rows, maxRetries = 3) {
  try {
    const provider = initializeProvider();
    if (!provider || useFallback) {
      console.log('[LLM Service] Using mock provider as fallback');
      return await new MockProvider().extractCRMData(rows);
    }
    const result = await provider.extractCRMData(rows);
    if (result && result.results && result.results.length > 0) {
      return result;
    }
    console.warn('[LLM Service] AI provider returned no results, falling back to mock');
    useFallback = true;
    return await new MockProvider().extractCRMData(rows);
  } catch (error) {
    console.error('[LLM Service] AI provider failed:', error.message);
    console.warn('[LLM Service] Falling back to mock provider');
    try {
      return await new MockProvider().extractCRMData(rows);
    } catch (mockError) {
      console.error('[LLM Service] Mock provider also failed:', mockError.message);
      return {
        results: [],
        errors: [{
          error: `AI Provider Error: ${error.message}`,
          hint: `Check that ${process.env.AI_PROVIDER || 'openai'}_API_KEY is set in .env.local`,
        }],
      };
    }
  }
}

module.exports = {
  extractAndMapCSVRows,
  CRM_STATUSES,
  DATA_SOURCES,
  initializeProvider,
  AIProviderFactory,
};
