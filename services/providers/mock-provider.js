const AIProvider = require('../ai-provider-interface');

class MockProvider extends AIProvider {
  constructor() {
    super();
    this.model = 'mock';
  }

  async extractCRMData(records) {
    const results = [];
    const errors = [];

    // Simulate processing with a small delay
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      await new Promise(resolve => setTimeout(resolve, 100));

      // Mock extraction logic
      const extracted = this.mockExtractRow(row, i);
      const validated = this.validateExtractedRow(extracted);

      if (validated.isValid && (extracted.email || extracted.mobile_without_country_code)) {
        results.push({
          ...extracted,
          rowIndex: i,
          source: 'csv_import',
          provider: 'mock',
        });
      } else if (!validated.isValid) {
        errors.push({
          rowIndex: i,
          error: `Validation failed: ${validated.errors.join(', ')}`,
          originalData: row,
        });
      }
    }

    return { results, errors };
  }

  mockExtractRow(row, index) {
    // Determine the name
    const rawName = row.name || row.full_name || row.fullName || row.lead_name || 
                     [row.first_name || row.firstName || row.given_name || '', row.last_name || row.lastName || row.family_name || ''].join(' ').trim() || 
                     'Valued Lead';

    // Parse phone numbers
    const rawPhone = row.mobile_without_country_code || row.phone_mobile || row.mobile || row.cell || row.phone || row.phone_number || '';
    let countryCode = row.country_code || '';
    let cleanMobile = rawPhone.replace(/\D/g, '');
    
    if (cleanMobile.startsWith('91') && cleanMobile.length > 10 && !countryCode) {
      countryCode = '+91';
      cleanMobile = cleanMobile.substring(2);
    } else if (cleanMobile.length > 10 && !countryCode) {
      countryCode = '+' + cleanMobile.substring(0, cleanMobile.length - 10);
      cleanMobile = cleanMobile.substring(cleanMobile.length - 10);
    } else if (cleanMobile && !countryCode) {
      countryCode = '+91'; // Fallback default
    }

    // Split secondary emails/phones if applicable
    const emails = (row.email || row.mail || row.e_mail || '').split(/[,;]/).map(e => e.trim()).filter(Boolean);
    const primaryEmail = emails[0] || '';
    const secondaryEmails = emails.slice(1);

    const crmNotesList = [];
    if (row.notes || row.comments || row.crm_note || row.remarks) {
      crmNotesList.push(row.notes || row.comments || row.crm_note || row.remarks);
    }
    if (secondaryEmails.length > 0) {
      crmNotesList.push(`[Secondary Emails]: ${secondaryEmails.join(', ')}`);
    }

    return {
      created_at: this.normalizeDate(row.created_at || row.created_date || row.date || new Date().toISOString()),
      name: rawName,
      email: primaryEmail,
      country_code: countryCode,
      mobile_without_country_code: cleanMobile,
      company: row.company || row.company_name || row.organization || '',
      city: row.city || '',
      state: row.state || '',
      country: row.country || '',
      lead_owner: row.lead_owner || 'test@gmail.com',
      crm_status: this.inferCRMStatus(row),
      crm_note: crmNotesList.join('; '),
      data_source: this.inferDataSource(row),
      possession_time: row.possession_time || '',
      description: row.description || '',
    };
  }

  inferCRMStatus(row) {
    const statusStr = (row.crm_status || row.status || row.type || '').toUpperCase();

    if (statusStr.includes('GOOD') || statusStr.includes('FOLLOW')) return 'GOOD_LEAD_FOLLOW_UP';
    if (statusStr.includes('CONNECT') || statusStr.includes('NOT')) return 'DID_NOT_CONNECT';
    if (statusStr.includes('BAD') || statusStr.includes('SPAM')) return 'BAD_LEAD';
    if (statusStr.includes('SALE') || statusStr.includes('DONE') || statusStr.includes('WON')) return 'SALE_DONE';

    return 'GOOD_LEAD_FOLLOW_UP'; // Default
  }

  inferDataSource(row) {
    const sourceStr = (row.data_source || row.source || row.origin || '').toLowerCase();

    if (sourceStr.includes('demand')) return 'leads_on_demand';
    if (sourceStr.includes('tower') || sourceStr.includes('meridian')) return 'meridian_tower';
    if (sourceStr.includes('eden') || sourceStr.includes('park')) return 'eden_park';
    if (sourceStr.includes('swamy') || sourceStr.includes('varah')) return 'varah_swamy';
    if (sourceStr.includes('plots') || sourceStr.includes('sarjapur')) return 'sarjapur_plots';

    return 'leads_on_demand'; // Default
  }

  normalizeDate(dateStr) {
    if (!dateStr) return '';

    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch {
      // Return empty if parsing fails
    }

    return '';
  }
}

module.exports = MockProvider;
