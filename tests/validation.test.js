const AIProvider = require('../services/ai-provider-interface');

class TestProvider extends AIProvider {
  async extractCRMData() { return { results: [], errors: [] }; }
}

const provider = new TestProvider();

describe('validateExtractedRow', () => {
  it('passes a row with email', () => {
    const row = { email: 'test@example.com' };
    const result = provider.validateExtractedRow(row);
    expect(result.isValid).toBe(true);
  });

  it('passes a row with mobile number', () => {
    const row = { mobile_without_country_code: '9876543210' };
    const result = provider.validateExtractedRow(row);
    expect(result.isValid).toBe(true);
  });

  it('fails a row with neither email nor phone', () => {
    const row = { name: 'No Contact' };
    const result = provider.validateExtractedRow(row);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/email|mobile/);
  });

  it('accepts valid crm_status values', () => {
    const valid = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'];
    valid.forEach(status => {
      const row = { email: 'a@b.com', crm_status: status };
      const result = provider.validateExtractedRow(row);
      expect(result.isValid).toBe(true);
    });
  });

  it('rejects invalid crm_status', () => {
    const row = { email: 'a@b.com', crm_status: 'INVALID_STATUS' };
    const result = provider.validateExtractedRow(row);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/crm_status/);
  });

  it('accepts valid data_source values', () => {
    const valid = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'];
    valid.forEach(source => {
      const row = { email: 'a@b.com', data_source: source };
      const result = provider.validateExtractedRow(row);
      expect(result.isValid).toBe(true);
    });
  });

  it('rejects invalid data_source', () => {
    const row = { email: 'a@b.com', data_source: 'unknown_source' };
    const result = provider.validateExtractedRow(row);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/data_source/);
  });

  it('accepts valid created_at date', () => {
    const row = { email: 'a@b.com', created_at: '2026-07-10T19:59:00Z' };
    const result = provider.validateExtractedRow(row);
    expect(result.isValid).toBe(true);
  });

  it('rejects invalid created_at date', () => {
    const row = { email: 'a@b.com', created_at: 'not-a-date' };
    const result = provider.validateExtractedRow(row);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/date/);
  });

  it('returns multiple errors for multi-invalid row', () => {
    const row = { name: 'Bad', crm_status: 'FAKE', data_source: 'FAKE', created_at: 'nope' };
    const result = provider.validateExtractedRow(row);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});
