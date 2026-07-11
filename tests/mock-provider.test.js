const MockProvider = require('../services/providers/mock-provider');

const provider = new MockProvider();

describe('MockProvider.extractCRMData', () => {
  it('extracts basic fields correctly', async () => {
    const rows = [{
      email: 'john@example.com',
      name: 'John Doe',
      phone: '9876543210',
      company: 'Acme Inc',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
    }];
    const { results, errors } = await provider.extractCRMData(rows);
    expect(results.length).toBe(1);
    expect(errors.length).toBe(0);
    expect(results[0].email).toBe('john@example.com');
    expect(results[0].name).toBe('John Doe');
    expect(results[0].company).toBe('Acme Inc');
    expect(results[0].city).toBe('Mumbai');
  });

  it('handles rows missing both email and phone as errors', async () => {
    const rows = [{ name: 'No Contact' }];
    const { results, errors } = await provider.extractCRMData(rows);
    expect(results.length).toBe(0);
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });

  it('extracts secondary phones into crm_note', async () => {
    const rows = [{
      email: 'a@b.com',
      phone: '9876543210, 9876543211, 9876543212',
    }];
    const { results } = await provider.extractCRMData(rows);
    const r = results[0];
    expect(r.mobile_without_country_code).toBe('9876543210');
    expect(r.crm_note).toContain('[Secondary Phones]');
    expect(r.crm_note).toContain('9876543211');
    expect(r.crm_note).toContain('9876543212');
  });

  it('extracts secondary emails into crm_note', async () => {
    const rows = [{
      email: 'primary@a.com, secondary@b.com, third@c.com',
      phone: '9876543210',
    }];
    const { results } = await provider.extractCRMData(rows);
    const r = results[0];
    expect(r.email).toBe('primary@a.com');
    expect(r.crm_note).toContain('[Secondary Emails]');
    expect(r.crm_note).toContain('secondary@b.com');
    expect(r.crm_note).toContain('third@c.com');
  });

  it('handles both secondary emails and phones in crm_note', async () => {
    const rows = [{
      email: 'a@b.com, b@c.com',
      phone: '111, 222',
    }];
    const { results } = await provider.extractCRMData(rows);
    const r = results[0];
    expect(r.crm_note).toContain('[Secondary Emails]');
    expect(r.crm_note).toContain('[Secondary Phones]');
  });

  it('infers crm_status correctly', async () => {
    const tests = [
      { input: 'GOOD_LEAD_FOLLOW_UP', expected: 'GOOD_LEAD_FOLLOW_UP' },
      { input: 'DID_NOT_CONNECT', expected: 'DID_NOT_CONNECT' },
      { input: 'BAD_LEAD', expected: 'BAD_LEAD' },
      { input: 'SALE_DONE', expected: 'SALE_DONE' },
      { input: 'unknown', expected: 'GOOD_LEAD_FOLLOW_UP' },
    ];
    for (const t of tests) {
      const rows = [{ email: 'a@b.com', crm_status: t.input }];
      const { results } = await provider.extractCRMData(rows);
      expect(results[0].crm_status).toBe(t.expected);
    }
  });

  it('infers data_source correctly', async () => {
    const tests = [
      { input: 'leads_on_demand', expected: 'leads_on_demand' },
      { input: 'meridian_tower', expected: 'meridian_tower' },
      { input: 'eden_park', expected: 'eden_park' },
      { input: 'varah_swamy', expected: 'varah_swamy' },
      { input: 'sarjapur_plots', expected: 'sarjapur_plots' },
      { input: 'random', expected: 'leads_on_demand' },
    ];
    for (const t of tests) {
      const rows = [{ email: 'a@b.com', data_source: t.input }];
      const { results } = await provider.extractCRMData(rows);
      expect(results[0].data_source).toBe(t.expected);
    }
  });

  it('sets default lead_owner', async () => {
    const rows = [{ email: 'a@b.com' }];
    const { results } = await provider.extractCRMData(rows);
    expect(results[0].lead_owner).toBe('test@gmail.com');
  });

  it('handles country code extraction from phone with +91 prefix', async () => {
    const rows = [{ email: 'a@b.com', phone: '919876543210' }];
    const { results } = await provider.extractCRMData(rows);
    expect(results[0].country_code).toBe('+91');
    expect(results[0].mobile_without_country_code).toBe('9876543210');
  });

  it('normalizes valid dates', async () => {
    const rows = [{ email: 'a@b.com', created_at: '2026-07-10T19:59:00Z' }];
    const { results } = await provider.extractCRMData(rows);
    expect(results[0].created_at).toBe('2026-07-10T19:59:00.000Z');
  });

  it('returns empty date for invalid dates', async () => {
    const rows = [{ email: 'a@b.com', created_at: 'not-a-date' }];
    const { results } = await provider.extractCRMData(rows);
    expect(results[0].created_at).toBe('');
  });

  it('maps firstName + lastName to name', async () => {
    const rows = [{ email: 'a@b.com', first_name: 'John', last_name: 'Doe' }];
    const { results } = await provider.extractCRMData(rows);
    expect(results[0].name).toBe('John Doe');
  });
});
