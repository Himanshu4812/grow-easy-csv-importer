const MockProvider = require('../services/providers/mock-provider');

describe('llm-service fallback', () => {
  let originalProvider;

  beforeAll(() => {
    originalProvider = process.env.AI_PROVIDER;
    process.env.AI_PROVIDER = 'mock';
  });

  afterAll(() => {
    process.env.AI_PROVIDER = originalProvider;
  });

  it('mock provider returns results for valid data', async () => {
    const provider = new MockProvider();
    const rows = [{ email: 'test@test.com', name: 'Test User' }];
    const { results, errors } = await provider.extractCRMData(rows);
    expect(results.length).toBe(1);
    expect(errors.length).toBe(0);
    expect(results[0].email).toBe('test@test.com');
  });

  it('mock provider returns errors for invalid data', async () => {
    const provider = new MockProvider();
    const rows = [{ name: 'No Info' }];
    const { results, errors } = await provider.extractCRMData(rows);
    expect(results.length).toBe(0);
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });

  it('mock provider handles empty input', async () => {
    const provider = new MockProvider();
    const { results, errors } = await provider.extractCRMData([]);
    expect(results.length).toBe(0);
    expect(errors.length).toBe(0);
  });

  it('mock provider processes multiple rows', async () => {
    const provider = new MockProvider();
    const rows = Array.from({ length: 10 }, (_, i) => ({
      email: `user${i}@test.com`,
      name: `User ${i}`,
    }));
    const { results, errors } = await provider.extractCRMData(rows);
    expect(results.length).toBe(10);
    expect(errors.length).toBe(0);
  });
});
