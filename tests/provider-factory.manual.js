// Factory Pattern Test Suite
// This demonstrates how the provider-agnostic architecture works

const AIProviderFactory = require('../services/ai-provider-factory');
const MockProvider = require('../services/providers/mock-provider');

console.log('=== AI Provider Factory Tests ===\n');

// Test 1: Mock Provider Creation
console.log('Test 1: Create Mock Provider');
try {
  process.env.AI_PROVIDER = 'mock';
  const provider = AIProviderFactory.create();
  console.log('✓ Mock provider created:', provider.constructor.name);
  console.log('✓ Is AIProvider instance:', provider instanceof MockProvider);
} catch (e) {
  console.error('✗ Failed:', e.message);
}

// Test 2: List Available Providers
console.log('\nTest 2: List Available Providers');
try {
  const providers = AIProviderFactory.getAvailableProviders();
  console.log('✓ Available providers:', providers);
} catch (e) {
  console.error('✗ Failed:', e.message);
}

// Test 3: Mock Provider Data Extraction
console.log('\nTest 3: Mock Provider Data Extraction');
(async () => {
  try {
    process.env.AI_PROVIDER = 'mock';
    const provider = AIProviderFactory.create();
    
    const testData = [
      {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        company: 'TechCorp',
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-5678',
      },
    ];

    const { results, errors } = await provider.extractCRMData(testData);
    console.log(`✓ Processed ${results.length} records`);
    console.log(`✓ Errors: ${errors.length}`);
    
    if (results.length > 0) {
      console.log('\nSample result:');
      console.log(JSON.stringify(results[0], null, 2));
    }
  } catch (e) {
    console.error('✗ Failed:', e.message);
  }
})();

// Test 4: OpenAI Provider Factory (should fail without API key)
console.log('\nTest 4: OpenAI Provider Factory (missing API key)');
try {
  process.env.AI_PROVIDER = 'openai';
  delete process.env.OPENAI_API_KEY;
  const provider = AIProviderFactory.create();
  console.error('✗ Should have thrown error but did not');
} catch (e) {
  console.log('✓ Correctly caught error:', e.message);
}

// Test 5: Gemini Provider Factory (should fail without API key)
console.log('\nTest 5: Gemini Provider Factory (missing API key)');
try {
  process.env.AI_PROVIDER = 'gemini';
  delete process.env.GEMINI_API_KEY;
  const provider = AIProviderFactory.create();
  console.error('✗ Should have thrown error but did not');
} catch (e) {
  console.log('✓ Correctly caught error:', e.message);
}

// Test 6: OpenRouter Provider Factory (should fail without API key)
console.log('\nTest 6: OpenRouter Provider Factory (missing API key)');
try {
  process.env.AI_PROVIDER = 'openrouter';
  delete process.env.OPENROUTER_API_KEY;
  const provider = AIProviderFactory.create();
  console.error('✗ Should have thrown error but did not');
} catch (e) {
  console.log('✓ Correctly caught error:', e.message);
}

// Test 7: Unsupported Provider
console.log('\nTest 7: Unsupported Provider');
try {
  process.env.AI_PROVIDER = 'unsupported_provider';
  const provider = AIProviderFactory.create();
  console.error('✗ Should have thrown error but did not');
} catch (e) {
  console.log('✓ Correctly caught error:', e.message);
}

// Test 8: Validation
console.log('\nTest 8: Row Validation');
try {
  process.env.AI_PROVIDER = 'mock';
  const provider = AIProviderFactory.create();
  
  // Valid record (has email)
  const validRecord = {
    name: 'John',
    email: 'john@example.com',
    crm_status: 'GOOD_LEAD_FOLLOW_UP',
    data_source: 'leads_on_demand',
    created_at: '2026-07-10T19:59:00Z',
  };
  
  const result1 = provider.validateExtractedRow(validRecord);
  console.log(`✓ Valid record validation: ${result1.isValid}`);
  if (!result1.isValid) console.log(`  Errors: ${result1.errors.join('; ')}`);
  
  // Invalid record (missing email and phone)
  const invalidRecord = {
    name: 'Jane',
    crm_status: 'GOOD_LEAD_FOLLOW_UP',
  };
  
  const result2 = provider.validateExtractedRow(invalidRecord);
  console.log(`✓ Invalid record validation: ${result2.isValid}`);
  console.log(`  Errors: ${result2.errors.join('; ')}`);
} catch (e) {
  console.error('✗ Failed:', e.message);
}

console.log('\n=== Tests Complete ===');
