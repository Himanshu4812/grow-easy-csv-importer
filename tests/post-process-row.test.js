const AIProvider = require('../services/ai-provider-interface');

class TestProvider extends AIProvider {
  async extractCRMData() { return { results: [], errors: [] }; }
}

const provider = new TestProvider();

describe('postProcessRow', () => {
  it('leaves single email unchanged', () => {
    const row = { email: 'test@example.com' };
    const result = provider.postProcessRow({ ...row });
    expect(result.email).toBe('test@example.com');
  });

  it('splits comma-separated emails', () => {
    const row = { email: 'a@b.com, c@d.com, e@f.com' };
    const result = provider.postProcessRow({ ...row });
    expect(result.email).toBe('a@b.com');
    expect(result.crm_note).toContain('[Secondary Emails]');
    expect(result.crm_note).toContain('c@d.com');
    expect(result.crm_note).toContain('e@f.com');
  });

  it('splits semicolon-separated emails', () => {
    const row = { email: 'a@b.com; c@d.com' };
    const result = provider.postProcessRow({ ...row });
    expect(result.email).toBe('a@b.com');
    expect(result.crm_note).toContain('c@d.com');
  });

  it('leaves single phone unchanged', () => {
    const row = { mobile_without_country_code: '9876543210' };
    const result = provider.postProcessRow({ ...row });
    expect(result.mobile_without_country_code).toBe('9876543210');
  });

  it('splits comma-separated phones', () => {
    const row = { mobile_without_country_code: '111, 222, 333' };
    const result = provider.postProcessRow({ ...row });
    expect(result.mobile_without_country_code).toBe('111');
    expect(result.crm_note).toContain('[Secondary Phones]');
    expect(result.crm_note).toContain('222');
    expect(result.crm_note).toContain('333');
  });

  it('appends secondary info to existing crm_note', () => {
    const row = {
      email: 'a@b.com, c@d.com',
      crm_note: 'Existing note',
    };
    const result = provider.postProcessRow({ ...row });
    expect(result.crm_note).toContain('Existing note');
    expect(result.crm_note).toContain('[Secondary Emails]');
  });

  it('handles row with no email or phone', () => {
    const row = { name: 'Test' };
    const result = provider.postProcessRow({ ...row });
    expect(result.name).toBe('Test');
    expect(result.crm_note).toBeUndefined();
  });

  it('strips non-digits from primary phone after split', () => {
    const row = { mobile_without_country_code: '+91-9876543210, +1-555-1234' };
    const result = provider.postProcessRow({ ...row });
    expect(result.mobile_without_country_code).toBe('919876543210');
  });

  it('handles empty string values', () => {
    const row = { email: '', mobile_without_country_code: '' };
    const result = provider.postProcessRow({ ...row });
    expect(result.email).toBe('');
    expect(result.mobile_without_country_code).toBe('');
  });
});
