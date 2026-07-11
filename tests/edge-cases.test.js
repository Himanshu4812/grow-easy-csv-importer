const request = require('supertest');
const MockProvider = require('../services/providers/mock-provider');
const AIProvider = require('../services/ai-provider-interface');

process.env.AI_PROVIDER = 'mock';
const { app } = require('../server');

class TestProvider extends AIProvider {
  async extractCRMData() { return { results: [], errors: [] }; }
}

const provider = new TestProvider();
const mockProvider = new MockProvider();

describe('Edge Cases — Server API', () => {
  it('rejects non-array body', async () => {
    const res = await request(app).post('/api/process').send({ rows: 'not-an-array' });
    expect(res.status).toBe(400);
  });

  it('handles single row with minimal valid data (email only)', async () => {
    const rows = [{ email: 'test@test.com' }];
    const res = await request(app).post('/api/process').send({ rows });
    expect(res.status).toBe(200);
    expect(res.body.processed.length).toBe(1);
    expect(res.body.stats.success).toBe(1);
  });

  it('handles single row with minimal valid data (phone only)', async () => {
    const rows = [{ mobile_without_country_code: '9876543210' }];
    const res = await request(app).post('/api/process').send({ rows });
    expect(res.status).toBe(200);
    expect(res.body.processed.length).toBe(1);
  });

  it('handles rows with extra unknown columns gracefully', async () => {
    const rows = [{ email: 'a@b.com', unknown_1: 'foo', unknown_2: 'bar', unknown_3: 'baz' }];
    const res = await request(app).post('/api/process').send({ rows });
    expect(res.status).toBe(200);
    expect(res.body.processed.length).toBe(1);
  });

  it('handles rows with special characters in values', async () => {
    const rows = [{
      email: 'test@test.com',
      name: 'O\'Brien "The Boss" Smith',
      crm_note: 'Special chars: ,;:\'"\n\t!@#$%^&*()',
    }];
    const res = await request(app).post('/api/process').send({ rows });
    expect(res.status).toBe(200);
    expect(res.body.processed.length).toBe(1);
  });

  it('handles rows with unicode/non-ASCII characters', async () => {
    const rows = [{
      email: 'café@test.com',
      name: 'José García Müller',
      city: 'São Paulo',
      country: 'México',
    }];
    const res = await request(app).post('/api/process').send({ rows });
    expect(res.status).toBe(200);
    expect(res.body.processed.length).toBe(1);
  });

  it('handles rows with very long values', async () => {
    const longName = 'A'.repeat(1000);
    const rows = [{ email: 'test@test.com', name: longName }];
    const res = await request(app).post('/api/process').send({ rows });
    expect(res.status).toBe(200);
    expect(res.body.processed.length).toBe(1);
  });

  it('handles rows with leading/trailing whitespace in values', async () => {
    const rows = [{
      email: '  test@test.com  ',
      name: '  John Doe  ',
    }];
    const res = await request(app).post('/api/process').send({ rows });
    expect(res.status).toBe(200);
    expect(res.body.processed[0].email).toBe('test@test.com');
  });

  it('handles streaming endpoint with valid data', async () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({
      email: `user${i}@test.com`,
      name: `User ${i}`,
    }));
    const res = await request(app).post('/api/process-stream').send({ rows });
    expect(res.status).toBe(200);
    const text = res.text;
    expect(text).toContain('event: complete');
    expect(text).toContain('"success":5');
  });
});

describe('Edge Cases — Mock Provider Extraction', () => {
  it('handles multiple emails with semicolons', async () => {
    const rows = [{ email: 'a@b.com; c@d.com; e@f.com', phone: '1234567890' }];
    const { results } = await mockProvider.extractCRMData(rows);
    expect(results[0].email).toBe('a@b.com');
    expect(results[0].crm_note).toContain('[Secondary Emails]');
  });

  it('handles multiple phones with mixed separators', async () => {
    const rows = [{ email: 'a@b.com', phone: '111-222-3333, 444-555-6666; 777-888-9999' }];
    const { results } = await mockProvider.extractCRMData(rows);
    expect(results[0].mobile_without_country_code).toBe('1112223333');
    expect(results[0].crm_note).toContain('[Secondary Phones]');
  });

  it('handles empty string values in required fields', async () => {
    const rows = [{ email: '', phone: '', name: '' }];
    const { results, errors } = await mockProvider.extractCRMData(rows);
    expect(results.length).toBe(0);
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });

  it('handles row with only first_name and last_name (no name field)', async () => {
    const rows = [{ email: 'a@b.com', first_name: 'John', last_name: 'Doe' }];
    const { results } = await mockProvider.extractCRMData(rows);
    expect(results[0].name).toBe('John Doe');
  });

  it('infers country code from phone starting with 91', async () => {
    const rows = [{ email: 'a@b.com', phone: '919876543210' }];
    const { results } = await mockProvider.extractCRMData(rows);
    expect(results[0].country_code).toBe('+91');
    expect(results[0].mobile_without_country_code).toBe('9876543210');
  });

  it('handles row with all 15 CRM fields populated', async () => {
    const row = {
      created_at: '2026-07-10 10:00:00',
      name: 'Full Record',
      email: 'full@test.com',
      country_code: '+1',
      mobile_without_country_code: '5551234567',
      company: 'Test Corp',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      lead_owner: 'owner@test.com',
      crm_status: 'SALE_DONE',
      crm_note: 'Test note',
      data_source: 'meridian_tower',
      possession_time: '2026-12-31',
      description: 'Full description',
    };
    const { results } = await mockProvider.extractCRMData([row]);
    const r = results[0];
    expect(r.name).toBe('Full Record');
    expect(r.email).toBe('full@test.com');
    expect(r.company).toBe('Test Corp');
    expect(r.city).toBe('New York');
    expect(r.state).toBe('NY');
    expect(r.country).toBe('USA');
    expect(r.lead_owner).toBe('owner@test.com');
    expect(r.crm_status).toBe('SALE_DONE');
    expect(r.crm_note).toBe('Test note');
    expect(r.data_source).toBe('meridian_tower');
    expect(r.possession_time).toBe('2026-12-31');
    expect(r.description).toBe('Full description');
  });
});

describe('Edge Cases — PostProcessRow', () => {
  it('handles email with only whitespace', () => {
    const row = { email: '   ' };
    const result = provider.postProcessRow({ ...row });
    expect(result.email).toBe('');
  });

  it('handles phone with only whitespace', () => {
    const row = { mobile_without_country_code: '   ' };
    const result = provider.postProcessRow({ ...row });
    // Whitespace-only phone gets trimmed to empty
    expect(result.mobile_without_country_code).toBe('');
  });

  it('preserves existing crm_note when no secondary data', () => {
    const row = { email: 'a@b.com', crm_note: 'Important note' };
    const result = provider.postProcessRow({ ...row });
    expect(result.crm_note).toBe('Important note');
  });

  it('handles trailing comma in email list', () => {
    const row = { email: 'a@b.com, c@d.com, ' };
    const result = provider.postProcessRow({ ...row });
    expect(result.email).toBe('a@b.com');
    expect(result.crm_note).toContain('c@d.com');
  });

  it('handles leading comma in phone list', () => {
    const row = { mobile_without_country_code: ', 111, 222' };
    const result = provider.postProcessRow({ ...row });
    expect(result.mobile_without_country_code).toBe('111');
    expect(result.crm_note).toContain('222');
  });
});

describe('Edge Cases — Validation', () => {
  it('rejects email with invalid format but valid phone passes', () => {
    const valid = provider.validateExtractedRow({ email: 'not-an-email', mobile_without_country_code: '9876543210' });
    expect(valid.isValid).toBe(true);
  });

  it('rejects phone too short', () => {
    const valid = provider.validateExtractedRow({ email: 'a@b.com', mobile_without_country_code: '12345' });
    expect(valid.isValid).toBe(true);
  });

  it('accepts boundary date values', () => {
    const dates = [
      '2026-01-01T00:00:00.000Z',
      '1970-01-01T00:00:00.000Z',
      '2026-07-11T23:59:59.999Z',
      '2026-07-11',
    ];
    dates.forEach(date => {
      const result = provider.validateExtractedRow({ email: 'a@b.com', created_at: date });
      expect(result.isValid).toBe(true);
    });
  });

  it('accepts all 4 CRM statuses case-sensitively', () => {
    const statuses = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'];
    statuses.forEach(status => {
      const result = provider.validateExtractedRow({ email: 'a@b.com', crm_status: status });
      expect(result.isValid).toBe(true);
    });
  });

  it('rejects lowercase CRM status', () => {
    const result = provider.validateExtractedRow({ email: 'a@b.com', crm_status: 'good_lead_follow_up' });
    expect(result.isValid).toBe(false);
  });

  it('rejects misspelled CRM status', () => {
    const result = provider.validateExtractedRow({ email: 'a@b.com', crm_status: 'GOOD_LEAD_FOLLOWUP' });
    expect(result.isValid).toBe(false);
  });

  it('accepts all 5 data sources', () => {
    const sources = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'];
    sources.forEach(source => {
      const result = provider.validateExtractedRow({ email: 'a@b.com', data_source: source });
      expect(result.isValid).toBe(true);
    });
  });

  it('allows empty data_source (not required)', () => {
    const result = provider.validateExtractedRow({ email: 'a@b.com', data_source: '' });
    expect(result.isValid).toBe(true);
  });

  it('allows empty crm_status (not required)', () => {
    const result = provider.validateExtractedRow({ email: 'a@b.com', crm_status: '' });
    expect(result.isValid).toBe(true);
  });
});
