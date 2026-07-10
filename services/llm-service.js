const AIProviderFactory = require('./ai-provider-factory');

const CRM_STATUSES = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'];
const DATA_SOURCES = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'];

let aiProvider = null;

// Initialize AI provider on demand
function initializeProvider() {
  if (!aiProvider) {
    try {
      aiProvider = AIProviderFactory.create();
      console.log('[LLM Service] AI provider initialized successfully');
    } catch (error) {
      console.error('[LLM Service] Failed to initialize AI provider:', error.message);
      throw error;
    }
  }
  return aiProvider;
}

async function extractAndMapCSVRows(rows, maxRetries = 3) {
  try {
    const provider = initializeProvider();
    return await provider.extractCRMData(rows);
  } catch (error) {
    console.error('[LLM Service] Error extracting CSV rows:', error.message);
    
    // Return mock results for testing if provider initialization fails
    if (process.env.AI_PROVIDER === 'mock' || process.env.NODE_ENV === 'test') {
      const mockProvider = AIProviderFactory.create();
      return await mockProvider.extractCRMData(rows);
    }

    return {
      results: [],
      errors: [
        {
          error: `AI Provider Error: ${error.message}`,
          hint: `Check that ${process.env.AI_PROVIDER || 'openai'}_API_KEY is set in .env.local`,
        },
      ],
    };
  }
}

module.exports = {
  extractAndMapCSVRows,
  CRM_STATUSES,
  DATA_SOURCES,
  initializeProvider,
  AIProviderFactory,
};
